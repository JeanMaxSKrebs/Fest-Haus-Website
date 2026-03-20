import styles from "./FestCoin.module.css";

interface FestCoinProps {
    frontImage?: string;
    backImage?: string;
    size?: number;
    className?: string;
    spinning?: boolean;
}

export default function FestCoin({
    frontImage = "/coin/festcoinfront.png",
    backImage = "/coin/festcoinback.png",
    size = 28,
    className = "",
    spinning = true,
}: FestCoinProps) {
    return (
        <div
            className={`${styles.coinContainer} ${className}`}
            style={{ width: size, height: size }}
            aria-hidden="true"
        >
            <div
                className={`${styles.coinInner} ${spinning ? styles.spinning : ""}`}
            >
                <div className={styles.coinFront}>
                    <img src={frontImage} alt="" />
                </div>

                <div className={styles.coinBack}>
                    <img src={backImage} alt="" />
                </div>
            </div>
        </div>
    );
}