# Background Image for Training Section

## Required Image Specifications

Please place a background image with the following specifications in this directory:

- **Filename**: `treino-background.png` or `treino-background.jpg` (PNG is currently configured)
- **Dimensions**: 1920x1080 pixels
- **Aspect Ratio**: 16:9
- **Format**: PNG or JPG

## CSS Configuration

The image will be displayed with the following CSS properties:
- `background-size: cover` - Ensures the image covers the entire area
- `background-position: center center` - Prioritizes the center of the image
- `background-repeat: no-repeat` - Prevents image repetition
- `background-attachment: scroll` - Uses scroll mode for optimal performance across devices

## Responsive Behavior

On smaller screens:
- The center of the image remains visible
- Lateral (left/right) parts may be cropped
- The image scales proportionally to maintain aspect ratio
- No vertical distortion occurs

## Implementation

The background is applied via the `.treino-background` CSS class in `/src/index.css`.

### Fallback

If the image is not present, a gradient fallback is automatically applied.
