import os
from PIL import Image, ImageEnhance, ImageFilter

input_dir = 'public/video-frames'
output_dir = 'public/video-frames-1080p'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print("Starting to process and clarify frames...")

target_size = (1920, 1080)

for i in range(1, 241):
    filename = f'ezgif-frame-{str(i).zfill(3)}.png'
    filepath = os.path.join(input_dir, filename)
    
    if os.path.exists(filepath):
        img = Image.open(filepath)
        
        # Upscale to 1080p using high-quality LANCZOS resampling
        img = img.resize(target_size, Image.Resampling.LANCZOS)
        
        # Apply a subtle sharpening filter to make it "more clearly"
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        
        # Boost contrast very slightly to make the premium aesthetic pop
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.1)
        
        # Save to new directory
        out_path = os.path.join(output_dir, filename)
        img.save(out_path, optimize=True)
        
        if i % 40 == 0:
            print(f"Processed {i} frames...")

print("Finished processing all frames!")
