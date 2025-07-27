# 🏛️ How to Set Up Your Own Gather Town Space

## Step 1: Create Your Gather Town Account

1. Go to [gather.town](https://gather.town)
2. Click "Get Started"
3. Sign up with email or Google account

## Step 2: Create Your Space

1. Click "Create Space"
2. Choose a template:
   - **Office** - Good for town hall style
   - **Social** - Great for casual meetups  
   - **Blank** - Start from scratch

3. Name your space (e.g., "CM's Note Town Hall")

## Step 3: Customize Your Space

### Map Editor
- Press `Ctrl/Cmd + Shift + E` to enter edit mode
- Add objects, furniture, and interactive elements
- Create different rooms and areas

### Recommended Layout:
```
┌─────────────────────────────────┐
│  🏢 Welcome Area                │
│                                 │
├────────┬────────┬───────────────┤
│ 🗣️     │ 💼     │ 🎮           │
│Meeting │ Work   │ Game         │
│Room 1  │ Space  │ Area         │
├────────┼────────┼───────────────┤
│ 🗣️     │ ☕     │ 📚           │
│Meeting │Coffee  │ Library      │
│Room 2  │Break   │              │
└────────┴────────┴───────────────┘
```

### Add Interactive Objects:
- **Whiteboards** - For collaboration
- **Embedded websites** - Show CM's Notes
- **Games** - For fun breaks
- **Private spaces** - For 1-on-1 chats

## Step 4: Get Your Space URL

1. Go to space settings (gear icon)
2. Find "Share" section
3. Copy your space URL:
   ```
   https://app.gather.town/app/YOUR_SPACE_ID/cms-note-town-hall
   ```

## Step 5: Update Your Code

1. Open `src/components/GatherTownLink.tsx`
2. Update the URL:
   ```typescript
   export default function GatherTownLink({ 
     spaceUrl = 'https://app.gather.town/app/YOUR_SPACE_ID/cms-note-town-hall' 
   }: GatherTownLinkProps) {
   ```

## Step 6: Space Settings

### Access Control
- **Password**: Optional password protection
- **Guest List**: Require approval
- **Member List**: Add team members

### Capacity
- Free: 25 concurrent users
- Paid: Unlimited ($7/user/month)

### Features to Enable
- ✅ Screen sharing
- ✅ Megaphone (announcements)
- ✅ Spotlight (presentations)
- ✅ Quiet mode areas

## Step 7: Best Practices

### Design Tips
1. **Clear pathways** - Easy navigation
2. **Labeled areas** - Use signs
3. **Meeting rooms** - Various sizes
4. **Fun zones** - Games and social areas
5. **Quiet spaces** - For focused work

### Community Guidelines
```markdown
# CM's Note Town Hall Rules

1. Be respectful to all members
2. Use appropriate rooms for meetings
3. Mute when not speaking in groups
4. Have fun and collaborate!
```

## Step 8: Launch Your Space

1. Test with a few users first
2. Create an onboarding guide
3. Schedule regular events
4. Share the link with your community!

## Alternatives to Consider

### If Gather Town doesn't work out:

1. **WorkAdventure** (Free, open source)
   ```bash
   docker run -p 80:80 thecodingmachine/workadventure
   ```

2. **Spatial.io** (3D, more immersive)
   - Better for showcases
   - NFT integration

3. **Mozilla Hubs** (VR-ready)
   - Great for special events
   - No account needed

4. **Branch** (Professional)
   - Enterprise features
   - Better moderation

## Need Help?

- Gather Town Docs: [support.gather.town](https://support.gather.town)
- Community: [community.gather.town](https://community.gather.town)
- Templates: [gather.town/templates](https://gather.town/templates)
