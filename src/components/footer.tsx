
import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#141413] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Code I Lab</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              {t("description")}
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://github.com/moutsea"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </Link>
              <Link
                href="https://x.com/madisonyu1992"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="mailto:cfjwlchangji@gmail.com"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("product.title")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                  {t("product.features")}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                  {t("product.pricing")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/docs`} className="text-gray-400 hover:text-white transition-colors">
                  {t("product.documentation")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/usage`} className="text-gray-400 hover:text-white transition-colors">
                  {t("product.usage")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("wealsobuilt.title")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="https://www.claudeide.net/" className="text-gray-400 hover:text-white transition-colors">
                  {t("wealsobuilt.claudeide")}
                </Link>
              </li>

              <li>
                <Link href="https://www.cs61bbeyond.com/" className="text-gray-400 hover:text-white transition-colors">
                  {t("wealsobuilt.cs61b")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} {t("copyright")}. {t("allRightsReserved")}
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href={`/${locale}/privacy`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {t("privacy")}
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {t("terms")}
              </Link>
              <Link
                href={`/${locale}/cookies`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {t("cookies")}
              </Link>
            </div>
          </div>

          {/* Outside Links Section */}
          {/* <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap justify-start gap-3">
              <a target="_blank" href="https://appalist.com" className="inline-block">
                <img src="https://appalist.com/assets/images/badge-dark.png" alt="Appa List" height="54" className="h-10 hover:opacity-80 transition-opacity" />
              </a>

              <a target="_blank" href="https://appsytools.com">
                <img src="https://appsytools.com/assets/images/badge-dark.png" alt="Appsy Tools" height="54" className="h-10 hover:opacity-80 transition-opacity" />
              </a>

              <a target="_blank" href="https://ashlist.com"><img src="https://ashlist.com/assets/images/badge-dark.png" alt="Ash List" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://beamtools.com"><img src="https://beamtools.com/assets/images/badge-dark.png" alt="Beam Tools" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://launchscroll.com"><img src="https://launchscroll.com/assets/images/badge-dark.png" alt="Launch Scroll" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://mystarttools.com"><img src="https://mystarttools.com/assets/images/badge-dark.png" alt="My Start Tools" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://poweruptools.com"><img src="https://poweruptools.com/assets/images/badge-dark.png" alt="Power Up Tools" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://productlistdir.com"><img src="https://productlistdir.com/assets/images/badge-dark.png" alt="Product List Dir" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://productwing.com"><img src="https://productwing.com/assets/images/badge-dark.png" alt="Product Wing" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://saasfield.com"><img src="https://saasfield.com/assets/images/badge-dark.png" alt="SaaS Field" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://saashubdirectory.com"><img src="https://saashubdirectory.com/assets/images/badge-dark.png" alt="SaaS Hub Directory" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://saastoolsdir.com"><img src="https://saastoolsdir.com/assets/images/badge-dark.png" alt="SaaS Tools Dir" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://saaswheel.com"><img src="https://saaswheel.com/assets/images/badge-dark.png" alt="SaaS Wheel" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://softwarebolt.com"><img src="https://softwarebolt.com/assets/images/badge-dark.png" alt="Software Bolt" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://solvertools.com"><img src="https://solvertools.com/assets/images/badge-dark.png" alt="Solver Tools" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://sourcedir.com"><img src="https://sourcedir.com/assets/images/badge-dark.png" alt="Source Dir" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>

              <a target="_blank" href="https://stackdirectory.com"><img src="https://stackdirectory.com/assets/images/badge-dark.png" alt="Stack Directory" height="54" className="h-10 hover:opacity-80 transition-opacity" /></a>
            </div>
          </div> */}
        </div>
      </div>
    </footer>
  );
}