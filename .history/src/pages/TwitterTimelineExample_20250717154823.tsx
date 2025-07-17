import { useState } from 'react';
import TwitterTimeline from '../components/TwitterTimeline';
import TwitterListTimeline from '../components/TwitterListTimeline';
import './TwitterTimelineExample.css';

function TwitterTimelineExample() {
  const [timelineType, setTimelineType] = useState<'single' | 'list'>('single');
  const [username, setUsername] = useState('TwitterDev');

  return (
    <div className="timeline-example">
      <h2>Twitter Embedded Timeline 예시</h2>
      
      <div className="timeline-options">
        <div className="option-group">
          <label>Timeline Type:</label>
          <select 
            value={timelineType} 
            onChange={(e) => setTimelineType(e.target.value as 'single' | 'list')}
          >
            <option value="single">Single User Timeline</option>
            <option value="list">Twitter List Timeline</option>
          </select>
        </div>
        
        {timelineType === 'single' && (
          <div className="option-group">
            <label>Username:</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Twitter username"
            />
          </div>
        )}
      </div>

      <div className="timeline-comparison">
        <div className="timeline-section">
          <h3>Twitter Embedded Timeline</h3>
          {timelineType === 'single' ? (
            <TwitterTimeline username={username} height={500} theme="light" />
          ) : (
            <TwitterListTimeline 
              ownerUsername="TwitterDev" 
              listSlug="national-parks" 
              height={500} 
              theme="light" 
            />
          )}
        </div>

        <div className="timeline-section">
          <h3>현재 구현 (Marquee)</h3>
          <div className="current-implementation">
            <p>현재 구현의 장점:</p>
            <ul>
              <li>✓ 여러 사용자의 트윗을 통합하여 표시</li>
              <li>✓ 흐르는 애니메이션 효과</li>
              <li>✓ 커스텀 디자인 적용 가능</li>
              <li>✓ CM 노트와 연동된 사용자만 필터링</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="recommendation">
        <h3>🤔 권장사항</h3>
        <p>
          <strong>현재 구현을 유지하면서 Twitter API를 추가로 연동</strong>하는 것을 추천합니다:
        </p>
        <ul>
          <li>CM 노트가 있는 여러 사용자의 트윗을 하나의 흐름으로 보여줄 수 있음</li>
          <li>디자인을 자유롭게 커스터마이징 가능</li>
          <li>Twitter Embedded Timeline은 단일 사용자 또는 리스트만 표시 가능</li>
        </ul>
        
        <h4>대안: Twitter List 활용</h4>
        <p>
          CM 노트가 있는 사용자들을 Twitter List로 만들어 관리하면, 
          Twitter List Timeline을 사용할 수 있습니다. 하지만:
        </p>
        <ul>
          <li>수동으로 리스트를 관리해야 함</li>
          <li>Marquee 효과 불가능</li>
          <li>디자인 커스터마이징 제한적</li>
        </ul>
      </div>
    </div>
  );
}

export default TwitterTimelineExample; 