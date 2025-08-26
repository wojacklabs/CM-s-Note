# 🎮 WorkAdventure Setup Guide

## 🌟 What We've Built

We've created a custom WorkAdventure virtual office for CM's Note with:

### Map Features:
- **2 Meeting Rooms**: With Jitsi video chat integration
- **2 Quiet Zones**: Silent areas for focused work
- **Interactive Whiteboard**: Opens Excalidraw for collaboration
- **Info Board**: Links to CM's Note website
- **Welcome Sign**: Greets visitors with instructions
- **Central Hub**: Open area for casual conversations

### Map Layout:
```
┌─────────────────────────────────────┐
│  Meeting    Central    Meeting      │
│  Room 1     Hub        Room 2       │
│             🎯                       │
│  [Video]    Welcome    [Video]      │
│                                     │
│  Quiet      Info       Quiet        │
│  Zone 1     Board      Zone 2       │
│  [Silent]   📋        [Silent]      │
└─────────────────────────────────────┘
```

## 🚀 How It Works

1. **Embedded in App**: The WorkAdventure iframe is integrated directly
2. **Custom Map**: Using our own tileset and map design
3. **Interactive Objects**: Press SPACE near objects to interact
4. **Proximity Chat**: Video/audio activates when near other players

## 🛠️ Customization Guide

### 1. Edit the Map

The map is defined in `public/workadventure-map/map.json`:

```json
{
  "layers": [
    // Floor layer (visual tiles)
    // Object layer (interactive zones)
    // Decoration layer (furniture)
  ]
}
```

### 2. Add New Objects

To add interactive objects, edit the objects layer:

```json
{
  "name": "new-object",
  "type": "website",
  "properties": [
    {
      "name": "openWebsite",
      "value": "https://your-url.com"
    }
  ],
  "x": 320,
  "y": 240,
  "width": 32,
  "height": 32
}
```

### 3. Object Types

- **start**: Spawn point
- **meeting**: Jitsi video room
- **silent**: No audio zone
- **website**: Opens URL
- **popup**: Shows message

### 4. Modify Tileset

Edit `generate-wa-tileset.cjs` and run:
```bash
node generate-wa-tileset.cjs
```

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended)

1. Create a new repository for your map
2. Add map files:
   ```
   map.json
   tileset.tsx
   tileset.png
   ```
3. Enable GitHub Pages
4. Update map URL in component

### Option 2: Same Server

Currently using the same server as the app:
```javascript
const DEFAULT_MAP_URL = window.location.origin + '/workadventure-map/map.json';
```

### Option 3: Self-Host WorkAdventure

```bash
git clone https://github.com/thecodingmachine/workadventure
cd workadventure
docker-compose up
```

Then use your own server URL.

## 🎨 Advanced Customization

### Custom Scripts

Add scripts to your map for advanced features:

```json
{
  "properties": [
    {
      "name": "script",
      "value": "./scripts/custom.js"
    }
  ]
}
```

### Custom Tiles

Create your own tileset with:
- Tiled Map Editor
- Aseprite
- Piskel

### Jitsi Configuration

Customize video chat rooms:
```json
{
  "name": "jitsiRoom",
  "value": "YourCustomRoomName"
},
{
  "name": "jitsiConfig",
  "value": {
    "startWithAudioMuted": true,
    "startWithVideoMuted": false
  }
}
```

## 🔧 Troubleshooting

### Map Not Loading?
- Check browser console for errors
- Verify map.json syntax
- Ensure tileset.png is accessible

### Video Not Working?
- Allow camera/microphone permissions
- Check if Jitsi is blocked by firewall
- Try different browser

### Performance Issues?
- Reduce map size
- Optimize tileset images
- Limit number of objects

## 📚 Resources

- [WorkAdventure Docs](https://workadventu.re/map-building)
- [Tiled Map Editor](https://www.mapeditor.org/)
- [Map Examples](https://github.com/thecodingmachine/workadventure-map-starter-kit)

## 🎉 Next Steps

1. **Test the Map**: Try all interactive features
2. **Customize Design**: Add your branding
3. **Add More Rooms**: Expand the office
4. **Create Events**: Schedule virtual meetups
5. **Share with Community**: Invite CM's Note users!

Enjoy your virtual office! 🏢✨
