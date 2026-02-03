# Health Tracker

A comprehensive personal health dashboard built with React and TypeScript, designed to help you track lab results, monitor diet, and visualize your health journey.

## 🚀 Key Features

### 🩸 Smart Lab Report Analysis
- **PDF Parsing**: Automatically extracts test results from standard lab report PDFs.
- **Intelligent Grouping**: Organizes thousands of test types into intuitive categories (e.g., "Complete Blood Count", "Lipid Profile", "Liver Function").
- **Smart Detection**: Uses "Name-First" recognition to handle complex layouts, including same-line values (e.g., "Hemoglobin 13.5") and text-based results.
- **Visual Insights**: Color-coded indicators for High, Low, and Normal values based on reference ranges.
- **Garbage Filtering**: Automatically filters out footer text, ads, and irrelevant data from reports.

### 🥗 Diet & Nutrition
- **Personalized Plans**: View and manage diet plans tailored to your health goals.
- **Macro Tracking**: (Planned) Monitor daily intake of proteins, fats, and carbs.

### 👤 Profile Management
- **Personal Health Record**: Keep track of vital stats like age, weight, height, and blood group.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with CSS Variables for theme consistency
- **PDF Processing**: `pdfjs-dist` for client-side parsing
- **Icons**: `lucide-react`
- **Storage**: Browser `IndexedDB` (for PDFs) and `localStorage` (for user data)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/health-tracker.git
    cd health-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## 🛡️ Privacy Focused
This application runs entirely in your browser.
- **No Server Uploads**: Your sensitive medical PDFs are processed locally on your device.
- **Local Storage**: Data is persisted in your browser's LocalStorage and IndexedDB.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
