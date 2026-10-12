import { Link } from "react-router-dom";

const Logo = (props: { url?: string; size?: string; fontSize?: string }) => {
  const { url = "/", size = "40px", fontSize = "24px" } = props;
  return (
    <div className="flex items-center justify-center sm:justify-start">
      <Link
        to={url}
        className={`rounded-xl flex items-center shadow-sm border border-emerald-500/20 dark:border-emerald-400/30 justify-center bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 transition-transform hover:scale-105`}
        style={{ width: size, height: size }}
      >
        <span
          className={`font-black text-white tracking-wider`}
          style={{ fontSize: fontSize }}
        >
          P
        </span>
      </Link>
    </div>
  );
};

export default Logo;
