import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import io, { Socket } from 'socket.io-client';
import { User } from '../types';
import './MetaverseView.css';

interface MetaverseViewProps {
  users: User[];
}

// Server URL
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:8547';

// Game configuration - Gather Town style
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const PLAYER_SPEED = 160;
const INTERACTION_DISTANCE = 100;
const PROXIMITY_DISTANCE = 150;

class TownHallScene extends Phaser.Scene {
  private players: Map<string, Phaser.GameObjects.Container> = new Map();
  private playerTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private playerChats: Map<string, { bubble: Phaser.GameObjects.Container; timeout: number }> = new Map();
  // private proximityCircles: Map<string, Phaser.GameObjects.Graphics> = new Map();
  public myPlayerId: string | null = null;
  private socket: Socket | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: any = null;
  private interactiveObjects: Phaser.GameObjects.Group | null = null;
  private proximityAreas: Map<string, { area: Phaser.GameObjects.Rectangle; players: Set<string> }> = new Map();
  public users: User[] = [];
  private currentTooltip: Phaser.GameObjects.Container | null = null;
  private interactionKey: Phaser.Input.Keyboard.Key | null = null;
  private nearbyInteractable: Phaser.GameObjects.GameObject | null = null;

  constructor() {
    super({ key: 'TownHallScene' });
    console.log('[Town Hall] Scene initialized');
  }

  init(data: { users: User[], socket: Socket | null }) {
    console.log('[Town Hall] Init with data:', data);
    this.users = data.users || [];
    this.socket = data.socket;
  }

  preload() {
    console.log('[Town Hall] Loading assets...');
    this.generateGatherTownAssets();
  }

  private generateGatherTownAssets() {
    // Create modern character sprites
    const charCanvas = document.createElement('canvas');
    charCanvas.width = 256;
    charCanvas.height = 256;
    const ctx = charCanvas.getContext('2d')!;

    // Character colors palette
    const colors = [
      { body: '#FF6B6B', accent: '#FF4444' },
      { body: '#4ECDC4', accent: '#2BA09C' },
      { body: '#45B7D1', accent: '#2890A8' },
      { body: '#96CEB4', accent: '#6FAF8D' },
      { body: '#DDA0DD', accent: '#BA7FC2' },
      { body: '#F4A460', accent: '#E08D3C' }
    ];

    // Draw characters for each direction (down, left, right, up)
    colors.forEach((color, colorIndex) => {
      ['down', 'left', 'right', 'up'].forEach((dir, dirIndex) => {
        const x = (colorIndex % 3) * 64 + 16;
        const y = Math.floor(colorIndex / 3) * 128 + dirIndex * 32;

        // Character body (rounded square)
        ctx.fillStyle = color.body;
        ctx.beginPath();
        ctx.arc(x + 8, y + 16, 14, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(x + 8, y + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Eyes based on direction
        ctx.fillStyle = '#000000';
        if (dir === 'down') {
          ctx.fillRect(x + 4, y + 8, 3, 3);
          ctx.fillRect(x + 10, y + 8, 3, 3);
        } else if (dir === 'up') {
          // No eyes visible from behind
        } else if (dir === 'left') {
          ctx.fillRect(x + 2, y + 8, 3, 3);
        } else if (dir === 'right') {
          ctx.fillRect(x + 11, y + 8, 3, 3);
        }

        // Simple limbs
        ctx.strokeStyle = color.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Arms
        ctx.moveTo(x - 2, y + 16);
        ctx.lineTo(x + 18, y + 16);
        // Legs
        ctx.moveTo(x + 6, y + 24);
        ctx.lineTo(x + 6, y + 30);
        ctx.moveTo(x + 10, y + 24);
        ctx.lineTo(x + 10, y + 30);
        ctx.stroke();
      });
    });

    this.textures.addCanvas('gather-characters', charCanvas);
  }

  create() {
    console.log('[Town Hall] Creating scene...');
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    // Create modern office environment
    this.createModernTownHall();

    // Create meeting spaces
    this.createMeetingSpaces();

    // Create interactive objects
    this.createInteractiveObjects();

    // Setup controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D');
    this.interactionKey = this.input.keyboard!.addKey('X');

    // Setup camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // Create spawn point
    const spawnX = MAP_WIDTH * TILE_SIZE / 2;
    const spawnY = MAP_HEIGHT * TILE_SIZE - 100;

    // Create local player
    if (!this.socket || !this.socket.connected) {
      this.createPlayer('local-player', spawnX, spawnY, 0, true);
      this.myPlayerId = 'local-player';
    }

    // Setup socket events
    if (this.socket) {
      this.setupSocketEvents();
    }

    // Add proximity detection
    this.time.addEvent({
      delay: 100,
      callback: this.checkProximity,
      callbackScope: this,
      loop: true
    });
  }

  private createModernTownHall() {
    const graphics = this.add.graphics();

    // Main floor - modern gray
    graphics.fillStyle(0x2C3E50);
    graphics.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    // Floor pattern
    graphics.lineStyle(1, 0x34495E, 0.3);
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        graphics.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Meeting room floors
    const rooms = [
      { x: 2, y: 2, w: 10, h: 8, color: 0x3498DB, name: 'Blue Room' },
      { x: 28, y: 2, w: 10, h: 8, color: 0x2ECC71, name: 'Green Room' },
      { x: 2, y: 20, w: 10, h: 8, color: 0xE74C3C, name: 'Red Room' },
      { x: 28, y: 20, w: 10, h: 8, color: 0xF39C12, name: 'Orange Room' }
    ];

    rooms.forEach(room => {
      // Room floor
      graphics.fillStyle(room.color, 0.2);
      graphics.fillRect(
        room.x * TILE_SIZE,
        room.y * TILE_SIZE,
        room.w * TILE_SIZE,
        room.h * TILE_SIZE
      );

      // Room walls
      graphics.lineStyle(4, room.color, 0.8);
      graphics.strokeRect(
        room.x * TILE_SIZE,
        room.y * TILE_SIZE,
        room.w * TILE_SIZE,
        room.h * TILE_SIZE
      );

      // Room label
      const label = this.add.text(
        (room.x + room.w / 2) * TILE_SIZE,
        (room.y - 0.5) * TILE_SIZE,
        room.name,
        {
          fontSize: '16px',
          color: '#FFFFFF',
          backgroundColor: '#000000',
          padding: { x: 8, y: 4 }
        }
      );
      label.setOrigin(0.5);
    });

    // Central hub
    graphics.fillStyle(0x9B59B6, 0.1);
    graphics.fillCircle(
      MAP_WIDTH * TILE_SIZE / 2,
      MAP_HEIGHT * TILE_SIZE / 2,
      200
    );
  }

  private createMeetingSpaces() {
    // Conference tables in rooms
    const tables = [
      { x: 7, y: 6, w: 4, h: 2 },   // Blue room
      { x: 33, y: 6, w: 4, h: 2 },  // Green room
      { x: 7, y: 24, w: 4, h: 2 },  // Red room
      { x: 33, y: 24, w: 4, h: 2 }, // Orange room
    ];

    const graphics = this.add.graphics();
    
    tables.forEach(table => {
      // Table
      graphics.fillStyle(0x8B4513);
      graphics.fillRect(
        table.x * TILE_SIZE,
        table.y * TILE_SIZE,
        table.w * TILE_SIZE,
        table.h * TILE_SIZE
      );

      // Table shine
      graphics.fillStyle(0xA0522D, 0.5);
      graphics.fillRect(
        table.x * TILE_SIZE + 4,
        table.y * TILE_SIZE + 4,
        table.w * TILE_SIZE - 8,
        table.h * TILE_SIZE - 8
      );

      // Chairs
      const chairPositions = [
        // Top row
        ...Array(table.w).fill(0).map((_, i) => ({ 
          x: table.x + i, 
          y: table.y - 1 
        })),
        // Bottom row
        ...Array(table.w).fill(0).map((_, i) => ({ 
          x: table.x + i, 
          y: table.y + table.h 
        }))
      ];

      chairPositions.forEach(pos => {
        graphics.fillStyle(0x4A4A4A);
        graphics.fillRect(
          pos.x * TILE_SIZE + 8,
          pos.y * TILE_SIZE + 8,
          TILE_SIZE - 16,
          TILE_SIZE - 16
        );
      });

      // Create proximity area for each table
      const area = this.add.rectangle(
        (table.x + table.w / 2) * TILE_SIZE,
        (table.y + table.h / 2) * TILE_SIZE,
        (table.w + 4) * TILE_SIZE,
        (table.h + 4) * TILE_SIZE,
        0x00FF00,
        0
      );
      area.setData('type', 'meeting_space');
      area.setData('id', `table_${table.x}_${table.y}`);
      
      this.proximityAreas.set(area.getData('id'), {
        area: area,
        players: new Set()
      });
    });

    // Central gathering space
    const centralHub = this.add.circle(
      MAP_WIDTH * TILE_SIZE / 2,
      MAP_HEIGHT * TILE_SIZE / 2,
      150,
      0x9B59B6,
      0
    );
    centralHub.setData('type', 'central_hub');
    centralHub.setData('id', 'central_hub');
    
    this.proximityAreas.set('central_hub', {
      area: centralHub as any,
      players: new Set()
    });
  }

  private createInteractiveObjects() {
    this.interactiveObjects = this.add.group();

    // Whiteboard
    const whiteboard = this.add.rectangle(
      20 * TILE_SIZE,
      1 * TILE_SIZE,
      6 * TILE_SIZE,
      3 * TILE_SIZE,
      0xFFFFFF
    );
    whiteboard.setStrokeStyle(4, 0x333333);
    whiteboard.setInteractive();
    whiteboard.setData('type', 'whiteboard');
    whiteboard.setData('message', 'Press X to use whiteboard');
    this.interactiveObjects.add(whiteboard);

    // Coffee station
    const coffee = this.add.container(5 * TILE_SIZE, 15 * TILE_SIZE);
    const coffeeBase = this.add.rectangle(0, 0, 40, 40, 0x8B4513);
    const coffeeCup = this.add.circle(0, -5, 12, 0x6F4E37);
    coffee.add([coffeeBase, coffeeCup]);
    coffeeBase.setInteractive();
    coffeeBase.setData('type', 'coffee');
    coffeeBase.setData('message', 'Press X for coffee ☕');
    this.interactiveObjects.add(coffeeBase);

    // Plants
    const plantPositions = [
      { x: 3, y: 3 }, { x: 37, y: 3 },
      { x: 3, y: 27 }, { x: 37, y: 27 },
      { x: 20, y: 10 }, { x: 20, y: 20 }
    ];

    plantPositions.forEach(pos => {
      const plant = this.add.container(pos.x * TILE_SIZE, pos.y * TILE_SIZE);
      const pot = this.add.rectangle(0, 5, 25, 20, 0x8B4513);
      const leaves = this.add.circle(0, -10, 20, 0x228B22);
      plant.add([pot, leaves]);
    });

    // Info kiosk
    const kiosk = this.add.container(35 * TILE_SIZE, 15 * TILE_SIZE);
    const kioskBase = this.add.rectangle(0, 0, 50, 60, 0x3498DB);
    const kioskScreen = this.add.rectangle(0, -10, 40, 30, 0x87CEEB);
    kiosk.add([kioskBase, kioskScreen]);
    kioskBase.setInteractive();
    kioskBase.setData('type', 'kiosk');
    kioskBase.setData('message', 'Press X for info');
    this.interactiveObjects.add(kioskBase);
  }

  private createPlayer(id: string, x: number, y: number, colorIndex: number, isLocal: boolean = false): Phaser.GameObjects.Container {
    // Remove existing player if any
    const existing = this.players.get(id);
    if (existing) {
      existing.destroy();
      this.players.delete(id);
    }

    // Player container
    const playerContainer = this.add.container(x, y);

    // Player sprite
    const playerSprite = this.add.sprite(0, 0, 'gather-characters');
    playerSprite.setFrame(colorIndex * 12); // Default to down facing
    playerContainer.add(playerSprite);

    // Player name
    const nameText = this.add.text(0, -25, '', {
      fontSize: '12px',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    nameText.setOrigin(0.5);
    playerContainer.add(nameText);

    // Set physics
    this.physics.add.existing(playerContainer);
    const body = playerContainer.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);
    body.setOffset(-12, -12);

    // Proximity indicator for local player
    if (isLocal) {
      const proximityCircle = this.add.graphics();
      proximityCircle.lineStyle(2, 0x00FF00, 0.3);
      proximityCircle.strokeCircle(0, 0, PROXIMITY_DISTANCE);
      playerContainer.add(proximityCircle);
      
      // Follow camera
      this.cameras.main.startFollow(playerContainer);
    }

    this.players.set(id, playerContainer);
    this.playerTexts.set(id, nameText);

    return playerContainer;
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on('currentPlayers', (players: Record<string, any>) => {
      console.log('[Town Hall] Current players:', players);
      Object.keys(players).forEach(id => {
        if (id !== this.socket?.id) {
          const player = players[id];
          this.createPlayer(id, player.x, player.y, player.colorIndex || 0);
          const nameText = this.playerTexts.get(id);
          if (nameText && player.name) {
            nameText.setText(player.name);
          }
        }
      });
    });

    this.socket.on('playerJoined', (player: any) => {
      console.log('[Town Hall] Player joined:', player.id);
      this.createPlayer(player.id, player.x, player.y, player.colorIndex || 0);
      const nameText = this.playerTexts.get(player.id);
      if (nameText && player.name) {
        nameText.setText(player.name);
      }
    });

    this.socket.on('playerLeft', (playerId: string) => {
      console.log('[Town Hall] Player left:', playerId);
      const player = this.players.get(playerId);
      if (player) {
        player.destroy();
        this.players.delete(playerId);
        this.playerTexts.delete(playerId);
      }
    });

    this.socket.on('playerMoved', (data: { id: string; x: number; y: number }) => {
      const player = this.players.get(data.id);
      if (player) {
        player.x = data.x;
        player.y = data.y;
      }
    });

    this.socket.on('chat', (data: { playerId: string; message: string }) => {
      this.showChatBubble(data.playerId, data.message);
    });

    // Request current state
    this.socket.emit('ready', {
      colorIndex: Math.floor(Math.random() * 6)
    });

    // Set my player ID
    this.myPlayerId = this.socket.id || null;
    this.createPlayer(
      this.myPlayerId!,
      MAP_WIDTH * TILE_SIZE / 2,
      MAP_HEIGHT * TILE_SIZE - 100,
      Math.floor(Math.random() * 6),
      true
    );
  }

  public showChatBubble(playerId: string, message: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    // Remove existing chat bubble
    const existing = this.playerChats.get(playerId);
    if (existing) {
      clearTimeout(existing.timeout);
      existing.bubble.destroy();
    }

    // Create chat bubble
    const bubble = this.add.container(player.x, player.y - 40);
    
    const bg = this.add.rectangle(0, 0, message.length * 8 + 20, 30, 0xFFFFFF);
    bg.setStrokeStyle(2, 0x000000);
    
    const text = this.add.text(0, 0, message, {
      fontSize: '12px',
      color: '#000000'
    });
    text.setOrigin(0.5);

    bubble.add([bg, text]);
    bubble.setDepth(1000);

    // Auto-hide after 5 seconds
    const timeout = window.setTimeout(() => {
      bubble.destroy();
      this.playerChats.delete(playerId);
    }, 5000);

    this.playerChats.set(playerId, { bubble, timeout });
  }

  private checkProximity() {
    if (!this.myPlayerId) return;
    const myPlayer = this.players.get(this.myPlayerId);
    if (!myPlayer) return;

    // Check interactive objects
    let foundInteractable = false;
    this.interactiveObjects?.children.entries.forEach(obj => {
      const distance = Phaser.Math.Distance.Between(
        myPlayer.x, myPlayer.y,
        (obj as any).x, (obj as any).y
      );

      if (distance < INTERACTION_DISTANCE) {
        if (this.nearbyInteractable !== obj) {
          this.nearbyInteractable = obj;
          this.showTooltip((obj as any).x, (obj as any).y - 40, (obj as any).getData('message'));
        }
        foundInteractable = true;
      }
    });

    if (!foundInteractable && this.nearbyInteractable) {
      this.hideTooltip();
      this.nearbyInteractable = null;
    }

    // Check proximity areas
    this.proximityAreas.forEach((area, id) => {
      const distance = Phaser.Math.Distance.Between(
        myPlayer.x, myPlayer.y,
        area.area.x, area.area.y
      );

      const wasInArea = area.players.has(this.myPlayerId!);
      const isInArea = distance < area.area.width / 2;

      if (isInArea && !wasInArea) {
        area.players.add(this.myPlayerId!);
        console.log(`[Town Hall] Entered ${id}`);
      } else if (!isInArea && wasInArea) {
        area.players.delete(this.myPlayerId!);
        console.log(`[Town Hall] Left ${id}`);
      }
    });
  }

  private showTooltip(x: number, y: number, text: string) {
    this.hideTooltip();
    
    const tooltip = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, text.length * 8 + 20, 30, 0x000000, 0.9);
    bg.setStrokeStyle(1, 0xFFFFFF);
    
    const textObj = this.add.text(0, 0, text, {
      fontSize: '12px',
      color: '#FFFFFF'
    });
    textObj.setOrigin(0.5);
    
    tooltip.add([bg, textObj]);
    tooltip.setDepth(1001);
    this.currentTooltip = tooltip;
  }

  private hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.destroy();
      this.currentTooltip = null;
    }
  }

  update() {
    if (!this.myPlayerId) return;
    
    const player = this.players.get(this.myPlayerId);
    if (!player) return;

    const body = player.body as Phaser.Physics.Arcade.Body;
    
    // Movement
    let vx = 0;
    let vy = 0;
    let moving = false;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      vx = -PLAYER_SPEED;
      moving = true;
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      vx = PLAYER_SPEED;
      moving = true;
    }

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      vy = -PLAYER_SPEED;
      moving = true;
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      vy = PLAYER_SPEED;
      moving = true;
    }

    body.setVelocity(vx, vy);

    // Emit movement to server
    if (moving && this.socket?.connected) {
      this.socket.emit('playerMovement', {
        x: player.x,
        y: player.y
      });
    }

    // Update chat bubble positions
    this.playerChats.forEach((chat, playerId) => {
      const chatPlayer = this.players.get(playerId);
      if (chatPlayer) {
        chat.bubble.x = chatPlayer.x;
        chat.bubble.y = chatPlayer.y - 40;
      }
    });

    // Check for interaction
    if (this.interactionKey?.isDown && this.nearbyInteractable) {
                const type = (this.nearbyInteractable as any).getData('type');
      switch(type) {
        case 'whiteboard':
          this.showChatBubble(this.myPlayerId, '✏️ Using whiteboard...');
          break;
        case 'coffee':
          this.showChatBubble(this.myPlayerId, '☕ Getting coffee...');
          break;
        case 'kiosk':
          this.showChatBubble(this.myPlayerId, '📋 Checking info...');
          break;
      }
    }
  }
}

export default function MetaverseView({ users }: MetaverseViewProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);

  const handleNameSubmit = (name: string) => {
    if (name && socketRef.current?.connected) {
      socketRef.current.emit('setName', name);
      setShowNameInput(false);
    }
  };

  useEffect(() => {
    if (!gameRef.current) return;

    let socket: Socket | null = null;

    // Socket connection
    try {
      socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        console.log('[Town Hall] Connected to server');
        setConnectionStatus('connected');
      });

      socket.on('connect_error', (error) => {
        console.error('[Town Hall] Connection error:', error.message);
        setConnectionStatus('disconnected');
      });

      socket.on('disconnect', () => {
        console.log('[Town Hall] Disconnected from server');
        setConnectionStatus('disconnected');
        setConnectedPlayers(0);
      });

      socket.on('currentPlayers', (players: Record<string, any>) => {
        setConnectedPlayers(Object.keys(players).length);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('[Town Hall] Failed to create socket:', error);
    }

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: MAP_WIDTH * TILE_SIZE,
      height: MAP_HEIGHT * TILE_SIZE,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [TownHallScene],
      backgroundColor: '#1a1a1a',
      pixelArt: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: true
      },
      callbacks: {
        postBoot: (game) => {
          console.log('[Town Hall] Game booted');
          game.scene.start('TownHallScene', { users, socket: socketRef.current });
        }
      }
    };

    // Create Phaser game
    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Update scene when users change
  useEffect(() => {
    if (phaserGameRef.current && phaserGameRef.current.scene.getScene('TownHallScene')) {
      const scene = phaserGameRef.current.scene.getScene('TownHallScene') as TownHallScene;
      scene.users = users;
    }
  }, [users]);

  return (
    <div className="metaverse-view town-hall">
      {/* Name Input Modal */}
      {showNameInput && (
        <div className="name-input-modal">
          <div className="name-input-content">
            <h3>🏛️ Welcome to Town Hall</h3>
            <p>Enter your name to join</p>
            <input
              type="text"
              placeholder="Your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  handleNameSubmit(playerName.trim());
                }
              }}
              maxLength={20}
              autoFocus
            />
            <button
              onClick={() => handleNameSubmit(playerName.trim())}
              disabled={!playerName.trim()}
            >
              Enter Town Hall
            </button>
          </div>
        </div>
      )}

      <div className="metaverse-header">
        <h2>🏛️ Town Hall</h2>
        <div className="metaverse-info">
          <span className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'}
            {' '}
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
          </span>
          <span className="connected-players">
            👥 {connectedPlayers || 1} online
          </span>
          <span className="controls-hint">
            Move: WASD/↑↓←→ | Interact: X
          </span>
        </div>
      </div>
      
      <div className="metaverse-game-container" ref={gameRef} />
      
      {/* Chat Input */}
      <div className="metaverse-chat">
        <input
          type="text"
          placeholder="Press Enter to chat..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && chatMessage.trim()) {
              if (socketRef.current?.connected) {
                socketRef.current.emit('chat', chatMessage);
              }
              const scene = phaserGameRef.current?.scene.getScene('TownHallScene') as TownHallScene;
              if (scene && scene.myPlayerId) {
                scene.showChatBubble(scene.myPlayerId, chatMessage);
              }
              setChatMessage('');
            }
          }}
          onFocus={() => {
            const scene = phaserGameRef.current?.scene.getScene('TownHallScene') as TownHallScene;
            if (scene) scene.input.keyboard?.enabled && (scene.input.keyboard.enabled = false);
          }}
          onBlur={() => {
            const scene = phaserGameRef.current?.scene.getScene('TownHallScene') as TownHallScene;
            if (scene) scene.input.keyboard?.enabled !== undefined && (scene.input.keyboard.enabled = true);
          }}
        />
      </div>
      
      <div className="metaverse-description">
        <p>Welcome to the virtual Town Hall! Meet and collaborate with others in real-time.</p>
        <p>• Join meeting rooms for private conversations</p>
        <p>• Use the whiteboard to share ideas</p>
        <p>• Chat with nearby players</p>
      </div>
    </div>
  );
}
