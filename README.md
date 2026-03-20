# BlackJack Web (Next.js + Tauri)

A premium, modern Blackjack game built with Next.js 16, React 19, Tailwind CSS v4, and encased in a Tauri v2 desktop application.

## 🚀 Tech Stack

- **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [Zustand v5](https://github.com/pmndrs/zustand) (with persist middleware)
- **Desktop Application:** [Tauri v2](https://tauri.app/) (Rust)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📂 Project Structure

```bash
src/
├── app/                  # Next.js App Router pages
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
├── rules/                # Game rules logic (Strategy Pattern)
├── store/                # Zustand state management slices
├── types/                # TypeScript interfaces and types
├── utils/                # Helper functions (audio, hand calculation, etc.)
src-tauri/                # Tauri (Rust) backend configuration
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **pnpm** (or npm/yarn)
- **Rust & Cargo** (Required for Tauri desktop app)
  - [Install Rust](https://www.rust-lang.org/tools/install)
  - Follow [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/blackjack-web.git
cd blackjack-web

# Install JavaScript dependencies
npm install
# or
pnpm install
# or
yarn install
```

## 🏃‍♂️ Development

### Web Development
To run the web version in your browser:

```bash
npm run dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Desktop Development (Tauri)
To run the desktop application in development mode:

```bash
npm run tauri dev
# or
pnpm tauri dev
```
This command will launch the Next.js dev server and a Tauri window.

## 🏗️ Build for Production

### Web Build
To build a static web export or production server:

```bash
npm run build
# or
pnpm build
```

### Desktop Build (Tauri)
To build the installable desktop application (exe/msi/dmg/deb):

```bash
npm run tauri build
# or
pnpm tauri build
```
The artifacts will be located in `src-tauri/target/release/bundle/`.

## 🧪 Testing

Unit tests for game rules and utility logic are planned.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
