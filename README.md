# TSLab

**TSLab** is a powerful, interactive TypeScript and Python notebook environment built with Next.js. Execute code in real-time, visualize outputs, and organize your work in a beautiful, modern interface.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-0066B8?style=flat&logo=visual-studio-code&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)

## ✨ Features

### 🚀 Multi-Language Support
- **TypeScript/JavaScript** execution with Sucrase compiler
- **Python** execution via Pyodide (runs directly in the browser)
- Full IntelliSense and autocomplete for both languages

### 📝 Rich Code Editing
- **Monaco Editor** integration (VS Code's editor)
- Syntax highlighting and error detection
- Custom code snippets
- Auto-formatting and bracket pair colorization
- Keyboard shortcuts (Ctrl+Enter to run, Cmd+S to save)

### 🎨 Modern UI/UX
- Beautiful, professional dark/light theme support
- Drag-and-drop cell reordering
- Markdown cells with GitHub Flavored Markdown
- Syntax-highlighted code output
- Responsive design

### 💾 Data Persistence
- PostgreSQL database with Prisma ORM
- User authentication via Supabase
- Auto-save functionality
- Notebook sharing capabilities

### 🌍 Internationalization
- Multi-language support (English & Portuguese)
- Easy to extend with additional languages

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4
- **Editor**: Monaco Editor
- **Database**: PostgreSQL with Prisma
- **Authentication**: Supabase
- **Code Execution**: 
  - TypeScript/JavaScript: Sucrase
  - Python: Pyodide
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites
- Node.js 20+ 
- pnpm (recommended) or npm
- PostgreSQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tslab
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/tslab"
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # JWT Secret
   JWT_SECRET=your-secret-key
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### Creating a Notebook

1. Sign up or log in to your account
2. Click "New Notebook" on the dashboard
3. Start adding cells (Code or Markdown)

### Working with Cells

#### Code Cells
- **Add a cell**: Click the "+" button
- **Execute code**: Press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
- **Change language**: Select TypeScript/JavaScript or Python from the dropdown
- **Delete cell**: Click the trash icon
- **Reorder cells**: Drag and drop using the grip handle

#### Markdown Cells
- Toggle between Code and Markdown using the cell type selector
- Supports GitHub Flavored Markdown
- Real-time preview

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Execute current cell |
| `Ctrl+S` / `Cmd+S` | Save notebook |
| `Shift+Enter` | Execute cell and move to next |
| `Ctrl+/` | Toggle comment |
| `Tab` | Indent/Autocomplete |

## 🏗️ Project Structure

```
tslab/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── notebook/          # Notebook editor
│   ├── settings/          # User settings
│   └── share/             # Shared notebooks
├── components/            # React components
│   ├── Auth.tsx          # Authentication
│   ├── Editor.tsx        # Monaco editor wrapper
│   ├── Notebook.tsx      # Notebook container
│   └── ...
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication helpers
│   ├── db.ts             # Database client
│   ├── monaco-snippets.ts # Editor snippets
│   └── ...
├── prisma/               # Database schema
│   └── schema.prisma
├── public/               # Static assets
└── providers.tsx         # React context providers
```

## 🔧 Configuration

### Database Schema

The application uses Prisma with PostgreSQL. Main models:

- **User**: User accounts and authentication
- **Notebook**: Notebook metadata
- **Cell**: Individual code/markdown cells
- **Settings**: User preferences

To modify the schema, edit `prisma/schema.prisma` and run:
```bash
npx prisma generate
npx prisma db push
```

### Theme Customization

Themes are configured in `tailwind.config.ts`. The app supports light and dark modes via `next-themes`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [Pyodide](https://pyodide.org/) - Python in the browser
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📧 Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and TypeScript
