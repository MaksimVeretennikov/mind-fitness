import { navigate } from '../lib/router';

export default function PricingPage() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate('/');
  };
  return (
    <div className="legal-page">
      <div className="legal-back">
        <button className="auth-link" onClick={goBack}>← Назад</button>
      </div>

      <header className="pricing-header">
        <h1>Простая подписка</h1>
        <p>Два тарифа: для индивидуальной работы и для учителя с группой</p>
      </header>

      <div className="pricing-grid">
        <article className="pricing-card pricing-card-light">
          <div className="pricing-tier">ИНДИВИДУАЛЬНЫЙ</div>
          <div className="pricing-price">490 ₽ <span>/ месяц</span></div>
          <p className="pricing-desc">
            Полный доступ ко всем 25+ упражнениям. Подойдёт ученику для
            самостоятельных занятий.
          </p>
          <ul className="pricing-list">
            <li>10+ когнитивных тренажёров</li>
            <li>11+ упражнений по русскому</li>
            <li>Блок «Кругозор»</li>
            <li>История ошибок и работа над ними</li>
            <li>Свой прогресс, очки, серии</li>
            <li>Живой фон, ежедневные бонусы</li>
          </ul>
        </article>

        <article className="pricing-card pricing-card-purple">
          <span className="pricing-badge">ДЛЯ РЕПЕТИТОРА</span>
          <div className="pricing-tier">УЧИТЕЛЬ</div>
          <div className="pricing-subtier">Для группы до 10 учеников</div>
          <div className="pricing-price">3 490 ₽ <span>/ месяц</span></div>
          <p className="pricing-desc">
            Всё из «Индивидуального» + инструменты для работы с группой. Один
            аккаунт на всю группу.
          </p>
          <ul className="pricing-list">
            <li>Всё из тарифа «Индивидуальный»</li>
            <li>Создание группы до 10 учеников</li>
            <li>Дашборд учителя — прогресс каждого</li>
            <li>Просмотр ошибок ученика по каждому упражнению</li>
            <li>Рейтинг группы для мотивации</li>
            <li>Аккаунт для каждого ученика</li>
          </ul>
        </article>
      </div>

      <section className="pricing-access glass">
        <h2>Как получить доступ</h2>
        <p>
          После оплаты на указанный вами email придёт индивидуальный код
          доступа. Введите его в форме регистрации на сайте — и сразу можно
          начинать заниматься. Подписка активируется на календарный месяц с
          момента регистрации.
        </p>
      </section>
    </div>
  );
}
