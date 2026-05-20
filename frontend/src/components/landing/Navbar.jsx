import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuMenu, LuX } from "react-icons/lu";
import deboLogo from "../../pages/assets/images/debo-logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled || isOpen
            ? "bg-white/95 backdrop-blur-md shadow-md py-1.5"
            : "bg-transparent py-2.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => {
                navigate("/");
                closeMenu();
              }}
            >
              <img
                src={deboLogo}
                alt="Debo Engineering"
                className="h-12 sm:h-14 md:h-16 w-auto"
              />
              <div className="ml-2.5 leading-tight">
                <h1 className="text-2xl font-extrabold text-[#194f87]">Debo</h1>
                <p className="text-sm font-semibold text-gray-600 tracking-wide">engineering</p>
                <p className="text-[10px] font-semibold text-gray-500 tracking-wider">
                  IN PURSUIT OF SERVICE
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-primary transition-colors text-base font-semibold px-1 py-1 border-b-2 border-transparent hover:border-primary"
                >
                  {link.name}
                </a>
              ))}
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-base font-semibold shadow-sm hover:bg-[#123f6c] transition-colors"
              >
                Login
              </button>
            </div>

            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <LuX className="text-2xl" /> : <LuMenu className="text-2xl" />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" onClick={closeMenu} />

        <div
          className={`absolute top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl p-6 pt-28 transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xl font-semibold text-gray-700 hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary pl-2"
                onClick={closeMenu}
              >
                {link.name}
              </a>
            ))}

            <button
              onClick={() => {
                navigate("/login", { replace: true });
                closeMenu();
              }}
              className="w-full bg-primary text-white text-lg font-semibold rounded-lg px-5 py-3 text-center shadow-sm hover:bg-[#123f6c] transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
