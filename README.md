# AI Use Cases for Law - Interactive Platform

A comprehensive web application for law students and legal professionals featuring an AI Use Case Repository and an intelligent Form Analyzer system.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

### 1. AI Use Case Repository
Browse, submit, and discover innovative ways law students and professionals are using AI in their work.

- **Browse Use Cases**: View approved AI use cases with categories and search
- **Submit Ideas**: Share your own AI applications in legal work
- **Admin Dashboard**: Review, approve, and categorize submissions

### 2. Form Analyzer & Questionnaire System (NEW!)
Upload any PDF form and let AI help you fill it out with an interactive questionnaire.

- **Intelligent Form Analysis**: AI detects questions and fields from uploaded PDFs
- **Interactive Questionnaire**: Step-by-step guided form completion
- **Automatic Form Filling**: Generates completed PDFs with your answers
- **Secure Storage**: Forms and answers stored in Firebase

📖 **[View detailed Form Analyzer documentation →](FORM_ANALYZER_README.md)**

## Quick Start

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd law-ai-repository
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First-Time Setup

- **Firebase**: The app is pre-configured with Firebase. Ensure Firebase Storage is enabled for the Form Analyzer feature.
- **Admin Access**: Use password `VAILL1!` to access the admin dashboard.
- **Form Analyzer**: Currently uses mock AI analysis. See [FORM_ANALYZER_README.md](FORM_ANALYZER_README.md) for production Claude API setup.

## Technology Stack

- **Frontend**: React 19 with Hooks
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **PDF Processing**: pdf-lib, pdfjs-dist
- **AI Integration**: Claude API (via backend - see documentation)
- **Icons**: Lucide React

## Project Structure

```
law-ai-repository/
├── public/              # Static assets
├── src/
│   ├── App.js          # Main application component
│   ├── FormAnalyzer.js # Form analyzer component
│   ├── aiService.js    # AI integration service
│   ├── firebase.js     # Firebase configuration
│   └── ...
├── FORM_ANALYZER_README.md  # Detailed Form Analyzer docs
└── package.json        # Dependencies
```

## Usage

### Using the AI Use Case Repository

1. **Browse**: Click "Browse" to view approved AI use cases
2. **Submit**: Click "Submit" to share your own AI use case
3. **Admin**: Click "Admin" to manage submissions (requires password)

### Using the Form Analyzer

1. **Upload**: Click "Form Analyzer" and upload a PDF form
2. **Analyze**: The system extracts questions from your form
3. **Answer**: Complete the interactive questionnaire
4. **Download**: Get your filled PDF form

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
