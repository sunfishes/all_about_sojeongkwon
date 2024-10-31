import './App.css';
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import challengerIcon from './images/challenger.png';
import masterIcon from './images/master.png';
import diamondIcon from './images/diamond.png';
import platinumIcon from './images/platinum.png';
import goldIcon from './images/gold.png';
import silverIcon from './images/silver.png';
import bronzeIcon from './images/bronze.png';

// 퀴즈 데이터
const quizData = [
  {
    question: "권소정의 생일은?",
    options: ["10월 13일", "10월 19일", "10월 24일", "10월 26일"],
    correctAnswer: 2,
    points: 10
  },
  {
    question: "권소정의 혈액형과 mbti는?",
    options: ["A형-ENTP", "B형-ENFP", "O형-ENTP", "AB형-ENFP"],
    correctAnswer: 0,
    points: 10
  },
  {
    question: "권소정이 겪었던 가장 기억남는 여행지는?",
    options: ["21살에 홀로 떠난 제주도", "22살 여름에 친구들이랑 간 첫 해외여행-일본 삿포로", "22.9살에 사촌언니와 떠난 호주", "23살 친구들과 태국 먹부림한 방콕"],
    correctAnswer: 2,
    points: 15
  },
  {
    question: "권소정이 최근 자주 사용하는 이모티콘은?",
    options: ["꼬질 망그러진 곰 2", "찌오의 바디랭귀지 3", "햄뿡이 방구 아직 잘 나와요.", "토심이는 토뭉이 뿐이야"],
    correctAnswer: 3,
    points: 15
  },
  {
    question: "권소정의 이상형은?",
    options: ["키 크고 피지컬 좋은 사람", "돈이 많은 사람", "배울점 많은 사람", "공부 잘하는 사람"],
    correctAnswer: 2,
    points: 10
  },
  {
    question: "권소정이 인생에서 가장 피하고 싶은 상황은?",
    options: ["가까운 사람과의 갈등", "꿈을 포기해야 하는 상황", "소중한 것을 잃는 일", "새로운 시도를 할 기회를 놓치는 것"],
    correctAnswer: 3,
    points: 15
  },
  {
    question: "권소정이 가장 싫어하는 사람은?",
    options: ["목소리크고 배나온사람", "전형적인 회피형", "맞춤법 틀리는 사람", "무임승차 하는 사람"],
    correctAnswer: 1,
    points: 15
  },
  {
    question: "다음 중 틀린것을 고르시오",
    options: ["무휴학편입임", "수영할 줄 모름", "코로나 한 번도 안걸려봄", "놀이기구 타는거 무서워함"],
    correctAnswer: 3,
    points: 15
  },
  {
    question: "권소정이 어렸을 때 꿈꾸던 직업은?",
    options: ["5살-공룡", "8살-우주비행사", "14살-팝송듣기가 취미인 치과의사", "18살-이두희 뺨치는 해커"],
    correctAnswer: 2,
    points: 20
  },
];

// 티어 시스템 추가
const getTier = (score) => {
  if (score >= 120) return { name: "챌린저", color: "#FF4E50", icon: challengerIcon };
  if (score >= 100) return { name: "마스터", color: "#9D4EDD", icon: masterIcon };
  if (score >= 85) return { name: "다이아몬드", color: "#00BCD4", icon: diamondIcon };
  if (score >= 70) return { name: "플래티넘", color: "#48CAE4", icon: platinumIcon };
  if (score >= 50) return { name: "골드", color: "#FFD700", icon: goldIcon };
  if (score >= 30) return { name: "실버", color: "#C0C0C0", icon: silverIcon };
  return { name: "브론즈", color: "#CD7F32", icon: bronzeIcon };
};


function App() {
  const [nickname, setNickname] = useState("");
  const [gameState, setGameState] = useState("start");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [rankings, setRankings] = useState([]);  // 초기값 빈 배열로 변경
  const [answerFeedback, setAnswerFeedback] = useState(null); // 답안 피드백
  const [showRankings, setShowRankings] = useState(false);

  // 랭킹 데이터 불러오기
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const q = query(
          collection(db, "rankings"),
          orderBy("score", "desc"),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const fetchedRankings = querySnapshot.docs.map(doc => doc.data());
        setRankings(fetchedRankings);
      } catch (error) {
        console.error("Error fetching rankings:", error);
      }
    };

    fetchRankings();
  }, []);

  // 점수 저장 함수
  const saveScore = async (finalScore) => {
    try {
      await addDoc(collection(db, "rankings"), {
        nickname,
        score: finalScore,
        timestamp: new Date().toISOString()
      });

      const q = query(
        collection(db, "rankings"),
        orderBy("score", "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const updatedRankings = querySnapshot.docs.map(doc => doc.data());
      setRankings(updatedRankings);
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  // 게임 시작 처리
  const handleStart = async (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      setGameState("quiz");
    }
  };

  // 게임 재시작 함수 추가
const handleRetry = () => {
  setGameState("start");
  setCurrentQuestion(0);
  setScore(0);
  setNickname("");
  setAnswerFeedback(null);
};

  // 답변 처리
  const handleAnswer = async (selectedIndex) => {
    const question = quizData[currentQuestion];
    const isCorrect = selectedIndex === question.correctAnswer;
    const newScore = score + (isCorrect ? question.points : 0);
  
    // 피드백 표시
    setAnswerFeedback({
      isCorrect,
      points: isCorrect ? `+${question.points}점` : "+0점"
    });
  
    // 0.8초 후에 다음 문제로 이동
    setTimeout(async () => {
      if (currentQuestion + 1 < quizData.length) {
        setScore(newScore);
        setCurrentQuestion(currentQuestion + 1);
        setAnswerFeedback(null);
      } else {
        setScore(newScore);
        await saveScore(newScore);
        setGameState("result");
      }
    }, 800);
  };

  return (
    <div className="App">
      <div className="quiz-container">
        <h1>All About 권소정</h1>
  
        {/* 시작 화면 */}
        {gameState === "start" && (
  <div className="start-screen">
    <form onSubmit={handleStart} className="nickname-form">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임을 입력하세요"
        required
      />
      <button type="submit">시작하기</button>
    </form>
    <button 
      onClick={() => setShowRankings(true)} 
      className="ranking-button"
    >
      랭킹 보기
    </button>
  </div>
)}

{/* 랭킹 모달 */}
{showRankings && (
  <div className="ranking-modal-overlay">
    <div className="ranking-modal">
      <h2>현재 랭킹</h2>
      <div className="rankings">
        {rankings.map((rank, index) => (
          <div
            key={index}
            className="ranking-item"
          >
            <div className="ranking-info">
              <img 
                src={getTier(rank.score).icon} 
                alt={getTier(rank.score).name} 
                className="rank-tier-icon"
              />
              <span>{index + 1}. {rank.nickname}</span>
            </div>
            <span>{rank.score}점</span>
          </div>
        ))}
      </div>
      <button 
        onClick={() => setShowRankings(false)}
        className="close-button"
      >
        닫기
      </button>
    </div>
  </div>
)}
  
        {/* 퀴즈 화면 */}
        {gameState === "quiz" && (
          <div className="quiz-screen">
            <div className="quiz-header">
              <span>문제 {currentQuestion + 1}/{quizData.length}</span>
              <span>현재 점수: {score}</span>
            </div>
            
            <h2>{quizData[currentQuestion].question}</h2>
            
            <div className="options">
              {quizData[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`option-button ${
                    answerFeedback && (
                      index === quizData[currentQuestion].correctAnswer 
                      ? 'correct' 
                      : ''
                    )
                  }`}
                  disabled={answerFeedback !== null}
                >
                  {option}
                </button>
              ))}
            </div>
  
            {answerFeedback && (
              <div className={`feedback ${answerFeedback.isCorrect ? 'correct' : 'wrong'}`}>
                {answerFeedback.isCorrect ? '정답입니다!' : '틀렸습니다!'}
                <span className="points">{answerFeedback.points}</span>
              </div>
            )}
          </div>
        )}
            
            {gameState === "result" && (
            <div className="result-screen">
              <h2>{nickname}님의 결과</h2>
              <div className="tier-result">
                <img 
                  src={getTier(score).icon} 
                  alt={getTier(score).name} 
                  className="tier-icon"
                />
                <div className="tier-badge" style={{ backgroundColor: getTier(score).color }}>
                  {getTier(score).name}
                </div>
              </div>
              <p className="final-score">{score}점</p>

              <div className="rankings">
                <h3>랭킹</h3>
                {rankings.map((rank, index) => (
                  <div
                    key={index}
                    className={`ranking-item ${rank.nickname === nickname ? 'current-user' : ''}`}
                  >
                    <div className="ranking-info">
                      <img 
                        src={getTier(rank.score).icon} 
                        alt={getTier(rank.score).name} 
                        className="rank-tier-icon"
                      />
                      <span>{index + 1}. {rank.nickname}</span>
                      <span className="tier-label" style={{ color: getTier(rank.score).color }}>
                        {getTier(rank.score).name}
                      </span>
                    </div>
                    <span>{rank.score}점</span>
                  </div>
                ))}
              </div>

              <button onClick={handleRetry} className="retry-button">
                다시 도전하기
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

export default App;