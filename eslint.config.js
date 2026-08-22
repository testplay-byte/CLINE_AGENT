import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '_references/**', 'src-tauri/target/**'] },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.{ts,tsx}'] })),
);