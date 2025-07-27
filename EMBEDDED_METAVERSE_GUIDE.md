# 🌐 Embedded Metaverse Integration Guide

## ✅ **Available Platforms (All Support iframe Embedding!)**

### 1. **Topia** ⭐ Recommended
- **Website**: [topia.io](https://topia.io)
- **Style**: 2D pixel art (Gather Town alternative)
- **Price**: Free tier available
- **Features**: Video chat, screen share, interactive objects

```html
<iframe 
  src="https://topia.io/YOUR_WORLD_ID?embed=true"
  width="100%" 
  height="700"
  allow="camera; microphone"
/>
```

### 2. **WorkAdventure** 🆓 Best Free Option
- **Website**: [workadventu.re](https://workadventu.re)
- **Style**: 2D pixel art, open source
- **Price**: 100% FREE
- **Features**: Self-hostable, Jitsi integration

```html
<iframe 
  src="https://play.workadventu.re/_/global/YOUR_MAP_URL"
  width="100%" 
  height="700"
  allow="camera; microphone"
/>
```

### 3. **Frame VR** 🎨 Best 3D Option
- **Website**: [framevr.io](https://framevr.io)
- **Style**: Beautiful 3D environments
- **Price**: Free tier (3 spaces)
- **Features**: VR support, drag-and-drop builder

```html
<iframe 
  src="https://framevr.io/YOUR_FRAME_ID"
  width="100%" 
  height="700"
  allow="camera; microphone; xr-spatial-tracking"
/>
```

### 4. **Mozilla Hubs** 🦊 Most Open
- **Website**: [hubs.mozilla.com](https://hubs.mozilla.com)
- **Style**: 3D with VR support
- **Price**: FREE
- **Features**: No account needed, privacy-focused

```html
<iframe 
  src="https://hubs.mozilla.com/YOUR_ROOM_ID"
  width="100%" 
  height="700"
  allow="camera; microphone; vr"
/>
```

## 🚀 **Quick Setup Guide**

### Step 1: Choose Your Platform

| Platform | Best For | Difficulty | Cost |
|----------|----------|------------|------|
| Topia | Professional events | Easy | Free-$$ |
| WorkAdventure | Self-hosting | Medium | Free |
| Frame VR | 3D showcases | Easy | Free-$ |
| Mozilla Hubs | Quick meetings | Very Easy | Free |

### Step 2: Create Your Space

#### **Topia Setup**
1. Sign up at [topia.io](https://topia.io)
2. Create new world
3. Customize with their editor
4. Get embed URL from settings

#### **WorkAdventure Setup**
1. Use map starter: [github.com/thecodingmachine/workadventure-map-starter-kit](https://github.com/thecodingmachine/workadventure-map-starter-kit)
2. Edit with Tiled editor
3. Host on GitHub Pages
4. Use play.workadventu.re URL

#### **Frame VR Setup**
1. Sign up at [framevr.io](https://framevr.io)
2. Create new frame
3. Drag and drop to build
4. Get share link

#### **Mozilla Hubs Setup**
1. Go to [hubs.mozilla.com](https://hubs.mozilla.com)
2. Create room (no account!)
3. Customize scene
4. Copy room URL

### Step 3: Update Your Code

```typescript
// In your React component
<EmbeddedMetaverse 
  provider="topia" // or 'workadventure', 'framevr', 'hubs'
  roomUrl="https://topia.io/cmnotes-townhall?embed=true"
/>
```

## 🎯 **Feature Comparison**

| Feature | Topia | WorkAdventure | Frame VR | Hubs |
|---------|-------|---------------|----------|------|
| 2D Graphics | ✅ | ✅ | ❌ | ❌ |
| 3D Graphics | ❌ | ❌ | ✅ | ✅ |
| Video Chat | ✅ | ✅ | ✅ | ✅ |
| Screen Share | ✅ | ✅ | ✅ | ✅ |
| Custom Maps | ✅ | ✅ | ✅ | ✅ |
| Mobile Support | ✅ | ✅ | ✅ | ✅ |
| VR Support | ❌ | ❌ | ✅ | ✅ |
| Self-Host | ❌ | ✅ | ❌ | ✅ |
| Free Tier | Limited | Unlimited | 3 spaces | Unlimited |

## 💡 **Pro Tips**

### For Best Performance
- **Topia**: Limit to 50 concurrent users
- **WorkAdventure**: Host on good server for 100+ users
- **Frame VR**: Keep under 20 for smooth experience
- **Hubs**: Max 25 per room

### Custom Branding
```css
/* Hide platform branding */
.iframe-container iframe {
  margin-top: -50px; /* Adjust based on platform */
  height: calc(100% + 50px);
}
```

### Security Considerations
```html
<!-- Recommended iframe permissions -->
<iframe 
  src="YOUR_METAVERSE_URL"
  allow="camera; microphone; display-capture"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
/>
```

## 🔧 **Advanced Integration**

### API Integration (Topia)
```javascript
// Send custom events
window.postMessage({
  type: 'topia-event',
  action: 'teleport',
  data: { x: 100, y: 200 }
}, '*');
```

### Self-Hosting WorkAdventure
```yaml
# docker-compose.yml
version: '3'
services:
  play:
    image: thecodingmachine/workadventure-play:latest
    ports:
      - "80:80"
```

## 📱 **Mobile Optimization**

```css
/* Responsive iframe */
.iframe-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
}

.iframe-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

## 🎉 **You're Ready!**

1. Choose your platform
2. Create your space
3. Embed in your app
4. Share with your community!

No more low-quality custom builds - use professional platforms that just work! 🚀
