import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "面接カンペ — オンライン面接のカンペを最前面に",
  description:
    "Zoomなどのオンライン面接中に、カンペを常に最前面の小窓に表示できる無料Webアプリ。内容はブラウザ内に自動保存され、サーバーには送信されません。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>{children}</body>
    </html>
  );
}
