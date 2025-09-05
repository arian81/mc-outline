interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="relative w-full px-3 py-3 md:px-6 md:py-4">
      <div className="flex w-full items-center justify-between">
        {/* Left positioned div - Logo/Brand */}
        <div className="flex flex-shrink-0 items-center gap-2 md:gap-3">
          <a
            href="/"
            className="flex h-7 w-7 items-center justify-center md:h-10 md:w-10"
          >
            <svg
              viewBox="0 0 256 256"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <title>McOutline</title>
              <rect width="256" height="256" rx="20" fill="#FDBF57" />
              <path
                d="m198.709 158.952-70.283 40.985-70.283-40.985a6.11 6.11 0 0 0-8.013 2.409 6.11 6.11 0 0 0 1.902 8.148l73.338 42.781a6.11 6.11 0 0 0 6.158 0l73.338-42.781a6.1 6.1 0 0 0 2.891-3.724 6.1 6.1 0 0 0-.621-4.674 6.1 6.1 0 0 0-3.762-2.841 6.1 6.1 0 0 0-4.665.682"
                fill="#7A003C"
              />
              <path
                d="m198.709 122.282-70.283 40.986-70.283-40.986a6.113 6.113 0 0 0-8.675 6.86 6.1 6.1 0 0 0 2.564 3.698l73.338 42.781a6.11 6.11 0 0 0 6.158 0l73.338-42.781a6.1 6.1 0 0 0 2.891-3.725 6.1 6.1 0 0 0-.621-4.673 6.1 6.1 0 0 0-3.762-2.841 6.1 6.1 0 0 0-4.665.681"
                fill="#7A003C"
              />
              <path
                d="m52.032 96.17 73.339 42.782a6.1 6.1 0 0 0 6.157 0l73.339-42.781a6.12 6.12 0 0 0 3.031-5.28 6.11 6.11 0 0 0-3.031-5.278l-73.339-42.78a6.11 6.11 0 0 0-6.157 0l-73.34 42.78a6.11 6.11 0 0 0 0 10.558"
                fill="#7A003C"
              />
            </svg>
          </a>
          <div
            className={`flex-col justify-center ${title ? "hidden md:flex" : "flex"}`}
          >
            <h1 className="font-bold text-mcmaster-maroon text-sm md:text-xl">
              McOutline
            </h1>
            <p className="text-mcmaster-gray text-sm">
              Find and share course outlines
            </p>
          </div>
        </div>

        {/* Center positioned div - Title */}
        <div className="-translate-x-1/2 absolute left-1/2 flex transform items-center px-2">
          {title && (
            <p className="max-w-[200px] truncate text-center font-semibold text-mcmaster-maroon text-sm md:max-w-none md:whitespace-nowrap md:text-sm lg:text-lg">
              {title}
            </p>
          )}
        </div>

        {/* Right positioned div - Credits */}
        <div className="flex flex-shrink-0 items-center">
          <p className="text-right text-mcmaster-gray text-xs md:text-sm">
            <span className="hidden md:inline">made by</span>
            <span className="md:hidden">by</span>
            <br />
            <a
              className="text-mcmaster-maroon"
              href="https://arian.gg"
              target="_blank"
              rel="noopener"
            >
              arian.gg
            </a>
          </p>
        </div>
      </div>
    </header>
  );
}
