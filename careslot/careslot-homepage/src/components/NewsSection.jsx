import React, { useEffect, useState } from 'react';
import './NewsSection.css';
import { apiRequest } from '../utils/api';

const RSS_URL = 'https://tuoitre.vn/rss/suc-khoe.rss';

// Hàm lấy ảnh ưu tiên thumbnail, nếu không có thì lấy enclosure.url hoặc enclosure.link
const getImage = (item) => {
  return (
    item.thumbnail ||
    (item.enclosure && (item.enclosure.url || item.enclosure.link)) ||
    ''
  );
};

const NewsSection = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchRSS = async () => {
      const res = await apiRequest(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`
      );
      const data = await res.json();
      setItems(data.items || []);
    };
    fetchRSS();
  }, []);

  if (items.length === 0) return null;

  // Tin lớn nhất
  const main = items[0];
  // Tin nổi bật bên phải
  const right = items[1];
  // 4 tin nhỏ phía dưới
  const smalls = items.slice(2, 6);

  return (
    <section id="news" className="news-section news-custom-layout">
      <div className="news-main-row">
        <div className="news-main">
          <a href={main.link} target="_blank" rel="noopener noreferrer">
            <img className="news-main-img" src={getImage(main)} alt={main.title} />
            <h2 className="news-main-title">{main.title}</h2>
            <div className="news-main-desc" dangerouslySetInnerHTML={{ __html: main.description.slice(0, 120) + '...' }} />
          </a>
        </div>
        <div className="news-right">
          <a href={right.link} target="_blank" rel="noopener noreferrer" className="news-right-item">
            <img className="news-right-img" src={getImage(right)} alt={right.title} />
            <h3 className="news-right-title">{right.title}</h3>
          </a>
          <ul className="news-right-list">
            {items.slice(2, 6).map((item, idx) => (
              <li key={item.guid || item.link}>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-right-link">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="news-small-row">
        {smalls.map(item => (
          <div className="news-small" key={item.guid || item.link}>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <img className="news-small-img" src={getImage(item)} alt={item.title} />
              <div className="news-small-title">{item.title}</div>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewsSection;