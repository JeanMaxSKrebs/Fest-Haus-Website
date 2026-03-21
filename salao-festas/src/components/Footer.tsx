import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <span>© 2026 Fest Haus</span>

                <span className="footer-separador">•</span>

                <Link to="/suporte" className="footer-link">
                    Contate o suporte
                </Link>
            </div>
        </footer>
    );
}