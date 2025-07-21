/// <reference path="https://unpkg.com/@workadventure/iframe-api-typings@latest/iframe_api.d.ts" />

// CM's Note Town Hall Script
console.log('🏛️ CM\'s Note Town Hall Script Loading...');

// Configuration
const TOWN_HALL_CONFIG = {
  name: "CM's Note Virtual Town Hall",
  version: "1.0.0",
  maxPlayers: 50,
  features: {
    proximityChat: true,
    achievements: true,
    statistics: true,
    events: true
  }
};

// Player statistics tracking
let playerStats = {
  totalVisits: 0,
  totalChatMessages: 0,
  roomsVisited: new Set(),
  achievementsUnlocked: new Set(),
  timeSpent: 0,
  startTime: Date.now()
};

// Initialize
WA.onInit().then(() => {
  console.log('✅ Town Hall initialized!');
  
  // Welcome sequence
  initializePlayer();
  
  // Set up room tracking
  setupRoomTracking();
  
  // Initialize features
  if (TOWN_HALL_CONFIG.features.achievements) {
    initializeAchievements();
  }
  
  if (TOWN_HALL_CONFIG.features.events) {
    initializeEvents();
  }
  
  // Start statistics tracking
  if (TOWN_HALL_CONFIG.features.statistics) {
    startStatisticsTracking();
  }
});

// Player initialization
async function initializePlayer() {
  // WA.player.name is already a string, not a promise
  const playerName = WA.player.name || 'Guest';
  
  // Load saved data
  const savedStats = WA.state.loadVariable(`playerStats_${playerName}`);
  if (savedStats) {
    playerStats = { ...playerStats, ...savedStats };
  }
  
  playerStats.totalVisits++;
  playerStats.startTime = Date.now();
  
  // Welcome message disabled - using UI guide instead
  // Removed all chat messages for cleaner experience
  
  // Update presence
  updatePlayerPresence('online');
}

// Tutorial for new players - disabled (using UI guide instead)
function showTutorial() {
  // Tutorial messages disabled - using separate UI guide
  return;
}

// Daily tips
function showDailyTip() {
  const tips = [
    "💡 Did you know? You can press M to see the full map!",
    "💡 Try the coffee machine in the cafe for a virtual boost!",
    "💡 The creative space has a collaborative whiteboard!",
    "💡 Meeting rooms support up to 20 people each!",
    "💡 Check the info board for CM's Note updates!",
    "💡 The GitHub portal leads to our repository!"
  ];
  
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todaysTip = tips[dayOfYear % tips.length];
  
  setTimeout(() => {
    WA.chat.sendChatMessage(todaysTip, 'Tip of the Day');
  }, 5000);
}

// Room tracking
function setupRoomTracking() {
  const rooms = [
    { layer: 'meeting-room-1', name: 'Blue Meeting Room', id: 'meeting1' },
    { layer: 'meeting-room-2', name: 'Green Meeting Room', id: 'meeting2' },
    { layer: 'quiet-zone-1', name: 'Quiet Zone', id: 'quiet' },
    { layer: 'creative-space', name: 'Creative Space', id: 'creative' },
    { layer: 'cafe-area', name: 'Cafe', id: 'cafe' }
  ];
  
  rooms.forEach(room => {
    WA.room.onEnterLayer(room.layer).subscribe(() => {
      playerStats.roomsVisited.add(room.id);
      WA.ui.displayActionMessage({
        message: `📍 You entered ${room.name}`,
        callback: () => {},
        type: 'message'
      });
      
      // Check for room-specific achievements
      checkRoomAchievements();
      
      // Room-specific actions
      handleRoomEntry(room.id);
    });
    
    WA.room.onLeaveLayer(room.layer).subscribe(() => {
      handleRoomExit(room.id);
    });
  });
}

// Room-specific handlers
function handleRoomEntry(roomId) {
  switch(roomId) {
    case 'meeting1':
    case 'meeting2':
      WA.controls.disableWebcam();
      WA.ui.displayActionMessage({
        message: "Press SPACE to start video meeting",
        callback: () => {
          WA.controls.restoreWebcam();
        },
        type: 'message'
      });
      break;
      
    case 'quiet':
      WA.controls.disableMicrophone();
      WA.ui.displayBubble('🔇 Microphone muted in quiet zone');
      break;
      
    case 'creative':
      WA.ui.displayActionMessage({
        message: "Press SPACE to open collaborative whiteboard",
        callback: () => {
          WA.chat.sendChatMessage('Opening whiteboard...', 'System');
        },
        type: 'message'
      });
      break;
      
    case 'cafe':
      // Play ambient sound
      playAmbientSound('cafe');
      break;
  }
}

function handleRoomExit(roomId) {
  switch(roomId) {
    case 'quiet':
      WA.controls.restoreMicrophone();
      WA.ui.displayBubble('🔊 Microphone unmuted');
      break;
      
    case 'cafe':
      stopAmbientSound();
      break;
  }
}

// Achievements system
const achievements = {
  firstSteps: {
    name: "First Steps",
    description: "Enter the Town Hall for the first time",
    icon: "👣",
    check: () => playerStats.totalVisits >= 1
  },
  explorer: {
    name: "Explorer",
    description: "Visit all 5 main areas",
    icon: "🗺️",
    check: () => playerStats.roomsVisited.size >= 5
  },
  socialButterfly: {
    name: "Social Butterfly",
    description: "Send 50 chat messages",
    icon: "🦋",
    check: () => playerStats.totalChatMessages >= 50
  },
  earlyBird: {
    name: "Early Bird",
    description: "Visit before 9 AM",
    icon: "🌅",
    check: () => new Date().getHours() < 9
  },
  nightOwl: {
    name: "Night Owl",
    description: "Visit after 10 PM",
    icon: "🦉",
    check: () => new Date().getHours() >= 22
  },
  dedicated: {
    name: "Dedicated",
    description: "Spend 1 hour in the Town Hall",
    icon: "⏰",
    check: () => playerStats.timeSpent >= 3600000
  },
  meetingMaster: {
    name: "Meeting Master",
    description: "Use both meeting rooms",
    icon: "🎥",
    check: () => playerStats.roomsVisited.has('meeting1') && playerStats.roomsVisited.has('meeting2')
  }
};

function initializeAchievements() {
  // Check achievements periodically
  setInterval(() => {
    Object.entries(achievements).forEach(([id, achievement]) => {
      if (!playerStats.achievementsUnlocked.has(id) && achievement.check()) {
        unlockAchievement(id, achievement);
      }
    });
  }, 5000);
}

function unlockAchievement(id, achievement) {
  playerStats.achievementsUnlocked.add(id);
  
  // Show notification
  WA.ui.displayBubble(`${achievement.icon} Achievement Unlocked: ${achievement.name}!`);
  WA.chat.sendChatMessage(achievement.description, 'Achievement');
  
  // Save progress
  savePlayerStats();
  
  // Special rewards
  if (playerStats.achievementsUnlocked.size === Object.keys(achievements).length) {
    WA.chat.sendChatMessage('🏆 Congratulations! You\'ve unlocked all achievements!', 'System');
  }
}

function checkRoomAchievements() {
  // Immediate check for room-based achievements
  if (playerStats.roomsVisited.size >= 5 && !playerStats.achievementsUnlocked.has('explorer')) {
    unlockAchievement('explorer', achievements.explorer);
  }
}

// Events system
const scheduledEvents = {
  "09:00": {
    name: "Morning Standup",
    message: "☕ Time for morning standup! Meet in the Blue Meeting Room",
    location: "meeting-room-1"
  },
  "12:00": {
    name: "Lunch Break",
    message: "🍽️ Lunch time! Head to the cafe for a virtual meal",
    location: "cafe-area"
  },
  "15:00": {
    name: "Creative Hour",
    message: "🎨 Creative hour begins! Join us in the Creative Space",
    location: "creative-space"
  },
  "17:00": {
    name: "Happy Hour",
    message: "🎉 Happy hour at the cafe! Time to relax and socialize",
    location: "cafe-area"
  }
};

function initializeEvents() {
  // Check for events every minute
  setInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (scheduledEvents[currentTime]) {
      announceEvent(scheduledEvents[currentTime]);
    }
  }, 60000);
  
  // Show next event on join
  showNextEvent();
}

function announceEvent(event) {
  WA.chat.sendChatMessage(`📢 ${event.name} is starting now!`, 'Event');
  WA.chat.sendChatMessage(event.message, 'Event');
  
  // Add waypoint
  WA.ui.displayActionMessage({
    message: `Join ${event.name}? Press SPACE to get directions`,
    callback: () => {
      WA.chat.sendChatMessage(`Follow the markers to ${event.location}`, 'System');
    },
    type: 'message'
  });
}

function showNextEvent() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  let nextEvent = null;
  let nextEventTime = null;
  
  Object.entries(scheduledEvents).forEach(([time, event]) => {
    const [hours, minutes] = time.split(':').map(Number);
    const eventMinutes = hours * 60 + minutes;
    
    if (eventMinutes > currentMinutes && (!nextEvent || eventMinutes < nextEventTime)) {
      nextEvent = event;
      nextEventTime = eventMinutes;
    }
  });
  
  if (nextEvent) {
    const hoursUntil = Math.floor((nextEventTime - currentMinutes) / 60);
    const minutesUntil = (nextEventTime - currentMinutes) % 60;
    
    setTimeout(() => {
      WA.chat.sendChatMessage(
        `📅 Next event: ${nextEvent.name} in ${hoursUntil}h ${minutesUntil}m`,
        'Schedule'
      );
    }, 8000);
  }
}

// Statistics tracking
function startStatisticsTracking() {
  // Track time spent
  setInterval(() => {
    playerStats.timeSpent = Date.now() - playerStats.startTime;
    
    // Auto-save every 5 minutes
    if (playerStats.timeSpent % 300000 < 60000) {
      savePlayerStats();
    }
  }, 60000);
  
  // Track chat messages
  WA.chat.onChatMessage((message) => {
    playerStats.totalChatMessages++;
    
    // Check for commands
    handleChatCommands(message);
  });
}

// Chat commands
function handleChatCommands(message) {
  if (!message.startsWith('/')) return;
  
  const [command, ...args] = message.split(' ');
  
  switch(command.toLowerCase()) {
    case '/help':
      showHelp();
      break;
      
    case '/stats':
      showStats();
      break;
      
    case '/achievements':
      showAchievements();
      break;
      
    case '/events':
      showEvents();
      break;
      
    case '/whereami':
      showLocation();
      break;
      
    case '/time':
      WA.chat.sendChatMessage(`Current time: ${new Date().toLocaleTimeString()}`, 'System');
      break;
      
    case '/about':
      showAbout();
      break;
  }
}

function showHelp() {
  const helpText = `
📋 Available Commands:
/help - Show this help
/stats - View your statistics
/achievements - View achievements
/events - Show today's events
/whereami - Show current location
/time - Show current time
/about - About CM's Note Town Hall
  `;
  WA.chat.sendChatMessage(helpText, 'Help');
}

function showStats() {
  const timeSpentMinutes = Math.floor(playerStats.timeSpent / 60000);
  const statsText = `
📊 Your Statistics:
• Total visits: ${playerStats.totalVisits}
• Messages sent: ${playerStats.totalChatMessages}
• Rooms explored: ${playerStats.roomsVisited.size}/5
• Time spent today: ${timeSpentMinutes} minutes
• Achievements: ${playerStats.achievementsUnlocked.size}/${Object.keys(achievements).length}
  `;
  WA.chat.sendChatMessage(statsText, 'Statistics');
}

function showAchievements() {
  let achievementText = '🏆 Achievements:\n';
  
  Object.entries(achievements).forEach(([id, achievement]) => {
    const unlocked = playerStats.achievementsUnlocked.has(id);
    const status = unlocked ? '✅' : '❌';
    achievementText += `${status} ${achievement.icon} ${achievement.name} - ${achievement.description}\n`;
  });
  
  WA.chat.sendChatMessage(achievementText, 'Achievements');
}

function showEvents() {
  let eventText = '📅 Today\'s Events:\n';
  
  Object.entries(scheduledEvents).forEach(([time, event]) => {
    eventText += `• ${time} - ${event.name}\n`;
  });
  
  WA.chat.sendChatMessage(eventText, 'Events');
}

function showLocation() {
  WA.player.getPosition().then(position => {
    const x = Math.floor(position.x / 32);
    const y = Math.floor(position.y / 32);
    WA.chat.sendChatMessage(`📍 You are at coordinates (${x}, ${y})`, 'Location');
  });
}

function showAbout() {
  const aboutText = `
🏛️ CM's Note Virtual Town Hall
Version: ${TOWN_HALL_CONFIG.version}
Max Players: ${TOWN_HALL_CONFIG.maxPlayers}

A virtual space for the CM's Note community to meet, collaborate, and share ideas.

Features:
• Video meeting rooms
• Quiet zones for focused work
• Creative space with whiteboard
• Cafe with ambience
• Achievement system
• Scheduled events

Built with ❤️ for the CM's Note community
  `;
  WA.chat.sendChatMessage(aboutText, 'About');
}

// Utility functions
function savePlayerStats() {
  const name = WA.player.name || 'Guest';
  // Convert Sets to Arrays for storage
  const statsToSave = {
    ...playerStats,
    roomsVisited: Array.from(playerStats.roomsVisited),
    achievementsUnlocked: Array.from(playerStats.achievementsUnlocked)
  };
  
  WA.state.saveVariable(`playerStats_${name}`, statsToSave);
}

function updatePlayerPresence(status) {
  const name = WA.player.name || 'Guest';
  WA.state.saveVariable(`presence_${name}`, {
    status: status,
    lastSeen: Date.now(),
    location: 'Town Hall'
  });
}

function playAmbientSound(type) {
  // Note: Actual sound implementation would require hosting audio files
  console.log(`Playing ${type} ambient sound`);
}

function stopAmbientSound() {
  console.log('Stopping ambient sound');
}

// Clean up on exit
window.addEventListener('beforeunload', () => {
  savePlayerStats();
  updatePlayerPresence('offline');
});

console.log('✅ CM\'s Note Town Hall Script Loaded Successfully!');
