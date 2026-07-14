import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://kanpe.aoisakana.com"),
  title: "面接カンペ — オンライン面接のカンペを最前面に",
  description:
    "Zoomなどのオンライン面接中に、カンペを常に最前面の小窓に表示できる無料Webアプリ。内容はブラウザ内に自動保存され、サーバーには送信されません。",
  openGraph: {
    title: "面接カンペ — オンライン面接のカンペを最前面に",
    description:
      "Zoomなどのオンライン面接中に、カンペを常に最前面の小窓に表示できる無料Webアプリ。登録不要・完全無料。",
    url: "https://kanpe.aoisakana.com",
    siteName: "面接カンペ",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "面接カンペ — オンライン面接のカンペを、常に最前面に。" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "面接カンペ — オンライン面接のカンペを最前面に",
    description:
      "Zoomなどのオンライン面接中に、カンペを常に最前面の小窓に表示できる無料Webアプリ。登録不要・完全無料。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>{children}</body>
    </html>
  );
}
