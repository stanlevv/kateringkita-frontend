import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-jakarta" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jetbrains" });

// Judul besar halaman pembuka.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["800"], variable: "--font-bricolage" });

export const fontVariables = `${inter.variable} ${jakarta.variable} ${jetbrains.variable} ${bricolage.variable}`;
