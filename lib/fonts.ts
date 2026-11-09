import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

// Sama dengan aplikasi mobile: Plus Jakarta Sans (variable, satu berkas) untuk judul, Inter untuk isi.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jetbrains" });

export const fontVariables = `${inter.variable} ${jakarta.variable} ${jetbrains.variable}`;
