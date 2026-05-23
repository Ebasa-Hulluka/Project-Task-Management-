import React from "react";
import { useNavigate } from "react-router-dom";
import { LuMail, LuMapPin, LuPhone, LuLinkedin } from "react-icons/lu";
import {
  FaFacebookF,
  FaTelegramPlane,
  FaYoutube,
  FaTiktok,
} from "react-icons/fa";
import deboLogo from "../../pages/assets/images/debo-logo.png";

const Footer = () => {
  const navigate = useNavigate();

  const contactItems = [
    {
      icon: <LuMapPin className="text-white" />,
      label: "Location",
      href: "https://maps.google.com/?q=Jimma,Oromia,Ethiopia",
      text: "Jimma, Oromia, Ethiopia",
    },
    {
      icon: <LuPhone className="text-white" />,
      label: "Phone",
      href: "tel:+251949540860",
      text: "+251 94 954 0860",
    },
    {
      icon: <LuMail className="text-white" />,
      label: "Email",
      href: "mailto:contact@deboengineering.com",
      text: "contact@deboengineering.com",
    },
  ];

  const socialLinks = [
    {
      icon: <FaFacebookF className="text-xl" />,
      label: "Facebook",
      href: "https://web.facebook.com/deboengineering?_rdc=1&_rdr#",
    },
    {
      icon: <LuLinkedin className="text-xl" />,
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/debo-engineering",
    },
    {
      icon: <FaTelegramPlane className="text-xl" />,
      label: "Telegram",
      href: "https://t.me/deboengineering",
    },
    {
      icon: <FaTiktok className="text-xl" />,
      label: "TikTok",
      href: "https://www.tiktok.com",
    },
    {
      icon: <FaYoutube className="text-xl" />,
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCSFW4-JLb7X5Y8-ThBX5NFg",
    },
  ];

  return (
    <footer
      id="contact"
      className="bg-gradient-to-r from-[#0f2b4c] via-[#123c63] to-[#0f5841] text-white pt-16 pb-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-10 border-b border-white/20">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={deboLogo} alt="Debo Engineering" className="h-24 w-auto" />
            <div className="ml-3">
              <h2 className="text-3xl font-bold">Debo</h2>
              <p className="text-sm text-white/85">Project Manager</p>
            </div>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xl font-semibold">Built for modern team delivery</p>
            <p className="text-white/80 mt-2">
              Plan, track, and collaborate in one workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-10 border-b border-white/20">
          <div>
            <h4 className="text-xl font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-white/90">
              <li>
                <a href="#features" className="text-white/90 hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#about" className="text-white/90 hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/90 hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-white/85">
              <li>Debo Engineering</li>
              <li>Task & Project Management</li>
              <li>In Pursuit of Service</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold mb-4">Contact Info</h4>

            <ul className="space-y-4 text-white/90">
              {contactItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 text-white/90 hover:text-white transition-colors"
                  >
                    <span className="w-7 h-7 border border-white/70 flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span>{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/90 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="pt-6 text-sm text-white/70 text-center">
          © 2026 Debo. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
