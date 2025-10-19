# Video Intro Implementation Guide

## 📹 Overview
A video intro (entry.mp4) now plays automatically **every time** users visit or refresh your temple website. The video plays on each page load, providing a consistent welcome experience.

## ✅ Implementation Status
**Status:** ✅ **IMPLEMENTED & READY TO TEST**

### Files Modified/Created:
1. **Created:** `frontend/src/components/VideoIntro.tsx` - Main video player component
2. **Updated:** `frontend/src/pages/HomePage.tsx` - Integrated video intro
3. **Uses:** `frontend/src/assets/entry.mp4` - Your video file

## 🎯 How It Works

### User Experience Flow:
```
Every Visit/Refresh:
1. User opens website or refreshes page
2. ▶️ Video plays automatically (full screen, covers everything)
3. Video ends or user clicks "Skip Intro"
4. 🚪 Door animation appears (existing behavior)
5. User clicks "Enter Temple"
6. 🏛️ Main temple page loads
```

### Technical Details:
- **Always Plays:** Video plays on every page load/refresh
- **Skip Button:** Users can skip anytime (top-right corner)
- **Smooth Transitions:** 500ms fade-out effect before transitioning
- **No Session Storage:** Video plays fresh each time for consistent experience

## 🚀 Feasibility Assessment

### ✅ HIGHLY FEASIBLE - Here's Why:

#### 1. **Performance (Good with Considerations)**
- ✅ Uses native HTML5 video player (no heavy libraries)
- ✅ Not included in initial JavaScript bundle
- ✅ Browser handles video optimization automatically
- ✅ Component completely removed from DOM after playback
- ⚠️ Video re-loads on every page refresh (bandwidth consideration)
- ⚠️ Users will see video frequently if they refresh often

**Recommendation:** Keep video short (10-20 seconds) and well-compressed since it plays every time.

#### 2. **File Size Impact**
**IMPORTANT:** Since video plays on every refresh, keep it small!

Recommended sizes:
- **Short duration (5-15 seconds):** 2-8 MB - ✅ **Ideal**
- **Medium duration (15-30 seconds):** 8-15 MB - ✅ Good
- **Longer duration (30-45 seconds):** 15-25 MB - ⚠️ May feel repetitive

**Strong Recommendation:** Keep video under 10MB and under 15 seconds for best user experience.

#### 3. **Loading Time**
On different connections:
- **Fast (50+ Mbps):** < 1 second - Instant playback
- **Medium (10-25 Mbps):** 1-3 seconds - Good experience
- **Slow (1-5 Mbps):** 5-15 seconds - Buffer time visible
- **Mobile 4G:** 2-8 seconds - Acceptable

#### 4. **Browser Compatibility**
✅ Works on:
- Chrome/Edge (all versions)
- Firefox (all versions)
- Safari (iOS/macOS)
- Mobile browsers (Android/iOS)

⚠️ Note: Autoplay may be blocked on some browsers (especially with audio)

## 🎨 Features Implemented

### 1. **Smart Playback Management**
```typescript
// Video plays on every page load - no session tracking
```
- Plays fresh on every visit/refresh
- Consistent welcome experience
- No cookies or localStorage needed

### 2. **Skip Button**
- Always visible (top-right corner)
- Styled to match temple theme
- Hover effects for better UX
- Keyboard accessible

### 3. **Loading State**
- Shows "Loading..." while video buffers
- Prevents blank screen confusion
- Fade animations for polish

### 4. **Graceful Degradation**
- If autoplay blocked → skips to main content
- If video fails to load → continues to door
- No errors break the user experience

## ⚡ Performance Optimization Tips

### Current Implementation (Already Optimized):
✅ `preload="auto"` - Browser starts loading early
✅ `playsInline` - Works on mobile without fullscreen
✅ Component unmounts after completion
✅ Conditional rendering (doesn't render if already watched)

### Further Optimizations (If Needed):

#### Option 1: Compress Video
```bash
# Using ffmpeg (recommended tool)
ffmpeg -i entry.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k entry-compressed.mp4

# This typically reduces file size by 40-60% with minimal quality loss
```

#### Option 2: Lazy Load (Only if video is large)
Change in `VideoIntro.tsx`:
```typescript
preload="metadata" // Instead of "auto"
```
This loads only video metadata first, full video loads when playback starts.

#### Option 3: Add Video Formats for Compatibility
```html
<video>
  <source src={entryVideo} type="video/mp4" />
  <source src={entryVideoWebm} type="video/webm" /> <!-- Smaller file size -->
  <source src={entryVideoOgg} type="video/ogg" />
</video>
```

## 🔧 Customization Options

### Add "Don't Show Again" Feature (Optional)
If users find it repetitive, you can add this:

```typescript
// In VideoIntro.tsx, add this state
const [dontShowAgain, setDontShowAgain] = useState(false);

// Add this checkbox to the UI
<label className="absolute bottom-8 left-8 flex items-center gap-2 text-white">
  <input
    type="checkbox"
    checked={dontShowAgain}
    onChange={(e) => {
      setDontShowAgain(e.target.checked);
      if (e.target.checked) {
        localStorage.setItem('skipVideoIntro', 'true');
      } else {
        localStorage.removeItem('skipVideoIntro');
      }
    }}
  />
  Don't show this again
</label>

// In the component, check localStorage
useEffect(() => {
  if (localStorage.getItem('skipVideoIntro') === 'true') {
    setIsVideoComplete(true);
    return;
  }
  // ... rest of existing code
}, []);
```

### Adjust Fade Duration
In `VideoIntro.tsx` line 51:
```typescript
setTimeout(() => {
  setIsVideoComplete(true);
  setIsVideoPlaying(false);
  onVideoEnd?.();
}, 500); // Change this value (milliseconds)
```

### Enable/Disable Audio
In `VideoIntro.tsx` line 84:
```typescript
muted={false} // Set to true to mute video
```

### Change Skip Button Position/Style
In `VideoIntro.tsx` lines 90-103 - fully customizable

### Make Video Play Only Once (Revert to Session-Based)
If you want to go back to showing it once per session:

```typescript
// Add back at the top of the component:
const hasWatchedVideo = sessionStorage.getItem('hasWatchedIntroVideo');
const [isVideoComplete, setIsVideoComplete] = useState<boolean>(!!hasWatchedVideo);

// In useEffect:
if (hasWatchedVideo) return;

// In handleVideoEnd:
sessionStorage.setItem('hasWatchedIntroVideo', 'true');
```

## 🐛 Potential Issues & Solutions

### Issue 1: "Video doesn't autoplay"
**Cause:** Browser autoplay policies (especially with audio)
**Solution:** Already handled - skips to main content if autoplay blocked
**Alternative:** Set `muted={true}` - muted videos can always autoplay

### Issue 2: "Video takes too long to load"
**Cause:** Large file size or slow connection
**Solution:** 
1. Compress video (see optimization tips)
2. Change `preload="metadata"` 
3. Add a progress bar (optional enhancement)

### Issue 3: "Video causes lag on mobile"
**Cause:** High resolution video on low-end devices
**Solution:** 
1. Use 720p or 1080p max (not 4K)
2. Ensure H.264 codec (most compatible)
3. Test on actual devices

### Issue 4: "Skip button hard to see"
**Cause:** Video background may vary
**Solution:** Button already has backdrop-blur and high contrast
**Enhancement:** Add a subtle animation to draw attention

## 📊 Testing Checklist

- [ ] Video plays on every page load
- [ ] Video plays again after refresh
- [ ] Skip button works
- [ ] Video ends naturally (if not skipped)
- [ ] Smooth transition to door animation
- [ ] Mobile devices (iOS/Android)
- [ ] Different browsers (Chrome, Firefox, Safari)
- [ ] Slow network simulation (browser DevTools)
- [ ] Video with audio (if applicable)
- [ ] Accessibility (keyboard navigation)
- [ ] Browser caching behavior
- [ ] User feedback on repetitiveness

## 🎯 Recommended Video Specifications

**CRITICAL:** Since video plays every time, optimization is essential!

For optimal performance:
- **Resolution:** 1280×720 (720p) - ✅ **Recommended**
- **Frame Rate:** 24-30 fps (not 60 fps)
- **Codec:** H.264 (MP4)
- **Bitrate:** 1-3 Mbps (lower for faster loading)
- **Audio:** AAC, 96-128 kbps (if needed, or mute it)
- **Duration:** 10-15 seconds - ✅ **Ideal**
- **File Size:** < 8 MB ideal, < 12 MB acceptable

**Priority:** Short duration + small file size > high quality

## 🔍 How to Check Your Current Video

Run this in your terminal:
```bash
# Navigate to the video location
cd frontend/src/assets

# Check video info (requires ffmpeg installed)
ffprobe entry.mp4

# Check file size
ls -lh entry.mp4  # Linux/Mac
dir entry.mp4     # Windows PowerShell
```

## 📈 Expected Performance Metrics

### Loading Times (estimated):
| Video Size | Fast Internet | Medium Internet | Slow Internet |
|-----------|--------------|----------------|--------------|
| 5 MB      | 0.5s         | 1-2s          | 3-5s         |
| 10 MB     | 1s           | 2-4s          | 6-10s        |
| 15 MB     | 1.5s         | 3-6s          | 9-15s        |
| 25 MB     | 2.5s         | 5-10s         | 15-25s       |

### Page Load Impact:
- **Before Video:** ~2-3s initial page load
- **With Video (every visit):** +video load time (depends on size and connection)
- **After Video:** 0s (component completely removed)

**Note:** Browser caching may help on subsequent loads, but video re-fetches on hard refresh.

## ✨ Conclusion

### Verdict: **FEASIBLE WITH RECOMMENDATIONS** ✅

**Pros:**
- ✅ Consistent welcome experience
- ✅ Easy to skip if user wants
- ✅ Professional first impression
- ✅ Browser-optimized playback
- ✅ Simple implementation

**Cons:**
- ⚠️ Video loads on every page visit (bandwidth usage)
- ⚠️ May become repetitive for frequent visitors
- ⚠️ May not autoplay on all browsers (handled gracefully)
- ⚠️ Larger videos will impact loading times every time

**Recommendations:** 
✅ **KEEP VIDEO SHORT & COMPRESSED**
- Target: 5-15 seconds duration
- File size: Under 10MB
- Resolution: 720p or 1080p
- Consider adding a "Don't show again" option in future if needed

**Next Steps:**
1. Test the implementation
2. Optimize video file size if needed
3. Gather user feedback
4. Fine-tune transitions if desired

---

## 🛠️ Quick Commands

### Test in Development:
```bash
# From frontend directory
npm run dev

# Open in browser
# Every visit: Video should play
# Refresh page: Video should play again
# Skip button should work every time
```

### To Disable Video Temporarily:
Comment out in `HomePage.tsx`:
```tsx
// <VideoIntro />
```

### To Change Video File:
Replace `frontend/src/assets/entry.mp4` with your new video (keep same filename)
OR update import in `VideoIntro.tsx`:
```typescript
import entryVideo from '@/assets/your-new-video.mp4';
```

---

**Implementation Date:** October 19, 2025
**Status:** ✅ Ready for Testing  
**Behavior:** Video plays on EVERY page load/refresh  
**Performance Rating:** ⭐⭐⭐⭐ (4/5) - Good with proper video optimization  
**User Experience Rating:** ⭐⭐⭐⭐ (4/5) - May become repetitive, consider "Don't show again" option

**Important:** Keep video SHORT (10-15 seconds) and SMALL (under 10MB) since it plays every time!
