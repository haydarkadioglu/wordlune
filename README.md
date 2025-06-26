# WordLune - AI-Powered Vocabulary Builder

**WordLune** is a modern web application designed to help users expand their vocabulary using the power of generative AI. Save, categorize, and master new words with intelligent tools that provide context, pronunciation, and translations on the fly.

## ✨ Key Features

*   **AI-Powered Word Details**: Get AI-generated example sentences, phonetic pronunciations (IPA), and translations for any word.
*   **Personalized Word Collection**: Save words to your personal collection and categorize them as "Very Good," "Good," or "Bad" based on your comfort level.
*   **Custom Vocabulary Lists**: Create specialized lists for different topics (e.g., "Business English," "Travel Vocabulary").
*   **Quick Translator**: Instantly translate words between supported languages and add them to your collection with a single click.
*   **Bulk Add**: Add multiple words at once by simply separating them with commas.
*   **Progress Tracking**: Visualize your learning journey with stats and a chart showing your weekly progress.
*   **Secure & Private**: All your data is securely stored in your own Firebase project, linked to your personal account.
*   **Light & Dark Mode**: Switch between themes for your viewing comfort.
*   **Multi-language UI**: Supports English and Turkish interfaces.

## 🛠️ Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
*   **AI Integration**: [Google Gemini Pro via Genkit](https://firebase.google.com/docs/genkit)
*   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
*   **Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

*   Node.js (v18 or newer)
*   npm, pnpm, or yarn
*   A Firebase project with Authentication (Email/Password & Google) and Firestore enabled.
*   A Google AI (Gemini) API Key.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of the project and add your Firebase and Google AI credentials.

    ```env
    # Firebase Project Credentials
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"

    # Google AI (Gemini) API Key
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"
    ```

4.  **Set up Firestore Security Rules:**
    Deploy the security rules located in `firestore.rules` to your Firebase project to ensure user data is secure. You can do this via the Firebase Console or using the Firebase CLI.

## 📜 Available Scripts

In the project directory, you can run:

*   `npm run dev`: Runs the app in development mode at `http://localhost:9002`.
*   `npm run build`: Builds the app for production.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the code using Next.js's built-in ESLint configuration.
