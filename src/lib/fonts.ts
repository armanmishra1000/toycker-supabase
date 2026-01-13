import localFont from "next/font/local"
import { Inter } from "next/font/google"

export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
})

export const grandstander = localFont({
    src: [
        {
            path: "../../public/assets/fonts/Grandstander-Regular.ttf",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/assets/fonts/Grandstander-Medium.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/assets/fonts/Grandstander-SemiBold.ttf",
            weight: "600",
            style: "normal",
        },
        {
            path: "../../public/assets/fonts/Grandstander-Bold.ttf",
            weight: "700",
            style: "normal",
        },
        {
            path: "../../public/assets/fonts/Grandstander-ExtraBold.ttf",
            weight: "800",
            style: "normal",
        },
    ],
    variable: "--font-Grandstander",
    display: "swap",
    preload: true,
})
