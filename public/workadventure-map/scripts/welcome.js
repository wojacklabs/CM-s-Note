/// <reference path="https://unpkg.com/@workadventure/iframe-api-typings@latest/iframe_api.d.ts" />

// CM's Note WorkAdventure 맵 스크립트

// 플레이어 입장 시 환영 메시지
WA.onInit().then(() => {
    console.log('Welcome to CM\'s Note Virtual Office!');
    
    // 환영 메시지 표시
    WA.chat.sendChatMessage('Welcome to CM\'s Note Virtual Office! 🎉', 'System');
    
    // 사용법 안내
    setTimeout(() => {
        WA.chat.sendChatMessage('Use arrow keys to move, press SPACE near objects to interact', 'Guide');
    }, 2000);
    
    // 플레이어 이름 가져오기
    WA.player.name.then((name) => {
        console.log('Player name:', name);
        
        // 방문 횟수 추적
        const visitKey = `visits_${name}`;
        const visits = (WA.state.loadVariable(visitKey) || 0) + 1;
        WA.state.saveVariable(visitKey, visits);
        
        if (visits === 1) {
            WA.chat.sendChatMessage(`Welcome ${name}! This is your first visit!`, 'System');
        } else {
            WA.chat.sendChatMessage(`Welcome back ${name}! Visit #${visits}`, 'System');
        }
    });
});

// 회의실 진입 시
WA.room.onEnterLayer('meeting-room-1').subscribe(() => {
    WA.ui.displayActionMessage({
        message: "Press SPACE to start video meeting",
        callback: () => {
            WA.chat.sendChatMessage('Starting video meeting...', 'System');
        }
    });
});

WA.room.onEnterLayer('meeting-room-2').subscribe(() => {
    WA.ui.displayActionMessage({
        message: "Press SPACE to start video meeting",
        callback: () => {
            WA.chat.sendChatMessage('Starting video meeting...', 'System');
        }
    });
});

// 조용한 구역 진입/퇴장
WA.room.onEnterLayer('quiet-zone-1').subscribe(() => {
    WA.controls.disablePlayerControls();
    WA.ui.displayBubble('🔇 Quiet Zone - Microphone muted');
    setTimeout(() => {
        WA.controls.restorePlayerControls();
    }, 2000);
});

WA.room.onLeaveLayer('quiet-zone-1').subscribe(() => {
    WA.ui.displayBubble('🔊 Microphone unmuted');
});

// 화이트보드 상호작용
let whiteboardOpen = false;
WA.room.onEnterLayer('whiteboard').subscribe(() => {
    WA.ui.displayActionMessage({
        message: "Press SPACE to open whiteboard",
        callback: () => {
            if (!whiteboardOpen) {
                WA.nav.openCoWebSite('https://excalidraw.com/', true, "");
                whiteboardOpen = true;
                WA.chat.sendChatMessage('Whiteboard opened! Draw your ideas!', 'System');
            }
        }
    });
});

WA.room.onLeaveLayer('whiteboard').subscribe(() => {
    if (whiteboardOpen) {
        WA.nav.closeCoWebSite();
        whiteboardOpen = false;
    }
});

// 정보 게시판
WA.room.onEnterLayer('info-board').subscribe(() => {
    WA.ui.displayActionMessage({
        message: "Press SPACE to view CM's Note website",
        callback: () => {
            WA.nav.openTab('https://cm-notes-web.vercel.app');
        }
    });
});

// 플레이어 추적 (온라인 카운터)
let playerCount = 0;
WA.players.onVariableChange('playerCount').subscribe((event) => {
    playerCount = event.value;
    updateOnlineCounter();
});

function updateOnlineCounter() {
    // 상태 바에 온라인 플레이어 수 표시
    if (document.getElementById('online-counter')) {
        document.getElementById('online-counter').textContent = `Online: ${playerCount}`;
    }
}

// 시간별 이벤트
const scheduledEvents = {
    "09:00": { message: "☕ Morning Coffee Time!", location: "cafe" },
    "12:00": { message: "🍽️ Lunch Break!", location: "cafe" },
    "15:00": { message: "🧘 Stretch Break - Visit the lounge!", location: "lounge" },
    "17:00": { message: "🎮 Game Time - Join us in the game area!", location: "game" }
};

// 매분마다 이벤트 체크
setInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (scheduledEvents[currentTime]) {
        const event = scheduledEvents[currentTime];
        WA.chat.sendChatMessage(event.message, 'Event');
        WA.ui.displayBubble(event.message);
    }
}, 60000);

// 이스터 에그
let secretCode = [];
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];

document.addEventListener('keydown', (e) => {
    secretCode.push(e.key);
    secretCode = secretCode.slice(-8);
    
    if (JSON.stringify(secretCode) === JSON.stringify(konamiCode)) {
        WA.chat.sendChatMessage('🎉 Konami Code activated! You found the secret!', 'Easter Egg');
        // 특별한 효과 추가
        WA.player.state.saveVariable('hasFoundEasterEgg', true);
    }
});

// 커스텀 명령어
WA.chat.onChatMessage((message) => {
    const msg = message.toLowerCase();
    
    if (msg.startsWith('/help')) {
        WA.chat.sendChatMessage(`
Available commands:
/help - Show this help
/time - Show current time
/online - Show online players
/about - About CM's Note
        `, 'Help');
    } else if (msg.startsWith('/time')) {
        const now = new Date();
        WA.chat.sendChatMessage(`Current time: ${now.toLocaleTimeString()}`, 'System');
    } else if (msg.startsWith('/online')) {
        WA.chat.sendChatMessage(`Players online: ${playerCount}`, 'System');
    } else if (msg.startsWith('/about')) {
        WA.chat.sendChatMessage(`CM's Note - A community platform for sharing notes and ideas!`, 'Info');
    }
});

// 업적 시스템
const achievements = {
    firstVisit: { name: "First Steps", description: "Enter the virtual office" },
    meetingMaster: { name: "Meeting Master", description: "Join 10 meetings" },
    socialButterfly: { name: "Social Butterfly", description: "Chat with 20 different people" },
    explorer: { name: "Explorer", description: "Visit all areas" }
};

function unlockAchievement(achievementId) {
    const achievement = achievements[achievementId];
    if (achievement && !WA.player.state.loadVariable(`achievement_${achievementId}`)) {
        WA.player.state.saveVariable(`achievement_${achievementId}`, true);
        WA.ui.displayBubble(`🏆 Achievement Unlocked: ${achievement.name}!`);
        WA.chat.sendChatMessage(`${achievement.description}`, 'Achievement');
    }
}

// 첫 방문 업적
unlockAchievement('firstVisit');

console.log('CM\'s Note WorkAdventure script loaded successfully!');
