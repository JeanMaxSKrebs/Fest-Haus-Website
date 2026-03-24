import FestCoin from "../components/coin/FestCoin";
import styles from "../styles/FestCoinPage.module.css";

export default function FestCoinPage() {
    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <div className={styles.coinWrapper}>
                    <FestCoin size={100} />
                </div>
            </div>
        </main>
    );
}