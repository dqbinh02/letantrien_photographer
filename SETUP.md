````markdown
# Photographer - Setup Instructions

## Project Created Successfully! 🎉

A new simplified photographer website has been created at:
`/Users/dqbinh/Documents/dqinh_project/portfolio-simple`

## Features
- **Two pages**: Album and Gallery
- Same framework as the original photographer site (Next.js 15, Once UI, React 19)
- Simplified navigation with only Album and Gallery links
- Theme switcher (light/dark mode)
- Responsive design

## Setup Instructions

### 1. Navigate to the project directory
```bash
cd /Users/dqbinh/Documents/dqinh_project/portfolio-simple
```

### 2. Install dependencies
```bash
pnpm install
# or
npm install
```

### 3. Run the development server
```bash
pnpm dev
# or
npm run dev
```

### 4. Open your browser
Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
photographer/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Main layout with header/footer
│   │   ├── page.tsx             # Home page
│   │   ├── album/
│   │   │   └── page.tsx         # Album page (renamed from blog)
│   │   └── gallery/
│   │       └── page.tsx         # Gallery page
│   ├── components/
│   │   ├── Header.tsx           # Navigation header
│   │   ├── Footer.tsx           # Footer with social links
│   │   ├── ThemeToggle.tsx      # Dark/light mode toggle
│   │   ├── Providers.tsx        # Theme and UI providers
│   │   └── gallery/
│   │       └── GalleryView.tsx  # Gallery grid component
│   ├── resources/
│   │   ├── content.tsx          # Content configuration
│   │   ├── config.ts            # UI configuration
│   │   ├── icons.ts             # Icon library
│   │   └── custom.css           # Custom styles
│   └── types/
│       ├── content.types.ts     # TypeScript types
│       └── css.d.ts             # CSS module types
├── public/
│   └── images/
│       └── gallery/             # Gallery images
├── package.json
├── tsconfig.json
├── next.config.mjs
└── tailwind.config.js
```

## Customization

### Update Personal Information
Edit `/src/resources/content.tsx`:
- Change `person` object with your name, email, etc.
- Update `social` array with your social media links
- Modify `album` and `gallery` page metadata

### Add Gallery Images
1. Place your images in `/public/images/gallery/`
2. Update the `images` array in `/src/resources/content.tsx`

### Configure Theme
Edit `/src/resources/config.ts`:
- Change colors, fonts, border styles
- Modify theme preferences
- Adjust visual effects

### Build for Production
```bash
pnpm build
# or
npm run build
```

Then start the production server:
```bash
pnpm start
# or
npm start
```

## Pages

- **Home (`/`)**: Landing page with welcome message
- **Album (`/album`)**: Photo albums page (you can add your album content)
- **Gallery (`/gallery`)**: Photo gallery with masonry grid layout

## Next Steps

1. **Add your avatar**: Place your avatar image in `/public/images/avatar.jpg`
2. **Customize content**: Update the content in `/src/resources/content.tsx`
3. **Add album functionality**: Implement your album view in `/src/app/album/page.tsx`
4. **Add more images**: Replace placeholder images with your own in `/public/images/gallery/`

Enjoy your new photographer website! 📸

````
