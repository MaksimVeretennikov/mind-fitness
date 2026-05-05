import { navigate } from '../lib/router';
import { OPERATOR } from '../lib/legalInfo';

export default function ContactsPage() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate('/');
  };
  return (
    <div className="legal-page">
      <div className="legal-back">
        <button className="auth-link" onClick={goBack}>← Назад</button>
      </div>

      <article className="contacts-card glass">
        <h1>Контакты</h1>
        <dl className="contacts-list">
          <div>
            <dt>ФИО</dt>
            <dd>{OPERATOR.fullName}</dd>
          </div>
          <div>
            <dt>ИНН</dt>
            <dd>{OPERATOR.inn}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd><a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a></dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd><a href={`tel:${OPERATOR.phone.replace(/\s/g, '')}`}>{OPERATOR.phone}</a></dd>
          </div>
          <div>
            <dt>Telegram</dt>
            <dd>
              <a
                href={`https://t.me/${OPERATOR.telegram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
              >{OPERATOR.telegram}</a>
            </dd>
          </div>
          <div>
            <dt>Город</dt>
            <dd>{OPERATOR.city}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
