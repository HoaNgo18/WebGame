import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true
    },
    resolve: {
        alias: {
            'shared': path.resolve(__dirname, '../shared/src'),
            'shared/constants': path.resolve(__dirname, '../shared/src/constants.js'),
            'shared/packetTypes': path.resolve(__dirname, '../shared/src/packetTypes.js')
        }
    }
});
