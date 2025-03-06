# Jackie's Photo Blog

A personal photo blog with commenting functionality. Features include:
- Password-protected admin access
- Photo uploads with descriptions and locations
- Public commenting without registration
- Responsive design
- Image storage using Cloudinary
- MongoDB database

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXTAUTH_SECRET=your_nextauth_secret
ADMIN_PASSWORD=your_secure_password
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- **Admin Access**: Use the admin password to log in and upload photos
- **Photo Management**: Add photos with descriptions and locations
- **Comments**: Visitors can leave comments without registering
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- MongoDB
- Cloudinary
- NextAuth.js 