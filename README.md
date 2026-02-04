# Health & Wellness Tracker Pro

A state-of-the-art Personal Health Record (PHR) and wellness dashboard powered by **AI** and **Cloud Sync**. Designed for individuals, coaches, and health admins to track vitals, analyze lab reports, and optimize nutrition.

## 🚀 Key Capabilities

### 🧠 AI-Powered Insights (Gemini)
- **Smart Diet Analysis**: Get personalized dietary feedback based on your health profile and recent logs.
- **Lab Report Interpreter**: Upload PDF lab reports and receive AI-driven explanations for abnormal results, along with food recommendations to improve them.
- **Meal Vision Scanner**: Snap a photo of your food to automatically identify items and estimate calories/macros.

### ☁️ Cloud Sync & Collaboration
- **Real-Time Data**: All data is synced instantly across devices using **Google Firestore**.
- **Role-Based Access Control (RBAC)**:
    - **User**: Personal tracking (Diet, Sleep, Workouts, Labs).
    - **Coach**: View-only access to assigned user data to provide guidance.
    - **Admin**: Manage user roles and system access.
- **Multi-Device**: Access your data seamlessly on Desktop, Tablet, or Mobile.

### 🥗 Advanced Nutrition & Fitness
- **Macro Tracking**: Log daily protein, fats, and carbs with visual progress bars.
- **Smart Calculations**: Auto-calculates BMI, BMR, and TDEE based on your profile using the Mifflin-St Jeor equation.
- **Specific Recommendations**: Receive tailored food suggestions (Eat/Avoid lists) based on your health goals (e.g., "Lose Weight", "Gain Muscle").

### 🩸 Intelligent Lab Management
- **PDF Parsing**: Client-side parsing of standard lab reports using `pdfjs-dist`.
- **Trend Analysis**: Visualize biomarkers over time (e.g., Hemoglobin, Glucose) with color-coded "High/Low/Normal" indicators.

### 📱 Enterprise-Ready UI
- **PWA Support**: Installable as a native-like app on iOS and Android.
- **Responsive Design**: Fully optimized for mobile interactions (Touch targets, Bottom/Side navigation).
- **Secure**: Authentication via Firebase (Google Sign-In / Email), Password Strength enforcement, and secure API key management.

## 🛠️ Technology Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build**: [Vite 7](https://vitejs.dev/) + [PWA Plugin](https://vite-pwa-org.netlify.app/)
- **Cloud Backend**: [Firebase](https://firebase.google.com/) (Auth, Firestore)
- **AI Engine**: [Google Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/) (Multimodal)
- **Styling**: Modern CSS Variables, Glassmorphism design, Responsive Grid
- **Utilities**: `lucide-react` (Icons), `pdfjs-dist` (PDF), `recharts` (Charts)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/VishnuPai/health-tracker.git
    cd health-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your Firebase and Gemini credentials:
    ```env
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
    ```
    *Note: The application requires a valid setup in Firebase Console (Auth + Firestore).*

4.  **Start Local Server**
    ```bash
    npm run dev
    # or for network testing
    npm run host
    ```

5.  **Build for Production**
    ```bash
    npm run build
    ```

## 🛡️ Security & Privacy
- **Secure Auth**: Uses secure tokens via Firebase Authentication.
- **Environment Variables**: Sensitive keys are not hardcoded (ensure `.env` is configured).
- **Role Protection**: Admin and Coach routes are protected by server-synced role checks.

## 🤝 Contributing
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
Distributed under the MIT License.
