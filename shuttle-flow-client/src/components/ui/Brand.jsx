import logo from "../../../public/logo.png";

export default function Brand({ size = 100, showText = false }) {
  return (
    <div className="brand" style={{ gap: 10 }}>
      <img src={logo} alt="Shuttle Flow" style={{ height: size, width: "auto" }} />
      {showText && <span>Shuttle Flow</span>}
    </div>
  );
}