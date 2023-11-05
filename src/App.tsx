import { ReactNode, useEffect, useState } from "react";
import liff from "@line/liff";
import "./App.css";
import SpecialMoveCard from "./component/SpecialMoveCard";
import { Tabs, Tab, Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { TailSpin } from 'react-loader-spinner';
import { SpecialMoveDto } from "./types";
import { JSX } from "react/jsx-runtime";

function App() {
  const [data, setData] = useState<SpecialMoveDto[]>([]);
  const [rateData, setRateData] = useState<SpecialMoveDto[]>([]);
  const [idToken, setIdToken] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myGallary, setMyGallary] = useState<SpecialMoveDto[]>([]);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const renderRankingList = (items: SpecialMoveDto[]) => {
    return items.map((item, index) => {
      let rankIcon: string | number | boolean | JSX.Element | Iterable<ReactNode>;
      let rankColor: string;

      switch (index) {
        case 0:
          rankIcon = <EmojiEventsIcon sx={{ color: "#ffd700" }} />;
          rankColor = "#ffd700";
          break;
        case 1:
          rankIcon = <EmojiEventsIcon sx={{ color: "#c0c0c0" }} />;
          rankColor = "#c0c0c0";
          break;
        case 2:
          rankIcon = <EmojiEventsIcon sx={{ color: "#cd7f32" }} />;
          rankColor = "#cd7f32";
          break;
      }
      return (
        <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h5" component="h2" sx={{ color: rankColor, mr: 1 }}>
              {rankIcon}
            </Typography>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
              {`${index + 1}位`}
            </Typography>
          </Box>
          <SpecialMoveCard data={item} myGallary={myGallary} idToken={idToken} />
        </Box>
      );
    });
  };
  const fetchData = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  };
  useEffect(() => {
    // liff関連のlocalStorageのキーのリストを取得
    const getLiffLocalStorageKeys = (prefix: string) => {
      const keys = []
      for (var i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.indexOf(prefix) === 0) {
          keys.push(key)
        }
      }
      return keys
    }
    // 期限切れのIDTokenをクリアする
    const clearExpiredIdToken = (liffId: any) => {
      const keyPrefix = `LIFF_STORE:${liffId}:`
      const key = keyPrefix + 'decodedIDToken'
      const decodedIDTokenString = localStorage.getItem(key)
      if (!decodedIDTokenString) {
        return
      }
      const decodedIDToken = JSON.parse(decodedIDTokenString)
      // 有効期限をチェック
      if (new Date().getTime() > decodedIDToken.exp * 1000) {
        const keys = getLiffLocalStorageKeys(keyPrefix)
        keys.forEach(function (key) {
          localStorage.removeItem(key)
        })
      }
    }
    const initializeLiff = async (id: string) => {
      clearExpiredIdToken(id);
      await liff.init({ liffId: id });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const token = liff.getIDToken();
      setIdToken(token);

      const baseUrl = 'https://original-specialmove.onrender.com';
      // fetch のリクエスト
      const formData = new FormData();
      formData.append('idToken', token);
      try {
        const [winCountRanking, winRateRanking, gallary] = await Promise.all([
          fetchData(`${baseUrl}/get-specialmove-ranking`),
          fetchData(`${baseUrl}/get-specialmove-ranking-winrate`),
          fetchData(`${baseUrl}/get-specialmove`, { method: 'POST', body: formData })
        ]);

        setData(winCountRanking);
        setRateData(winRateRanking);
        setMyGallary(gallary);
      } catch (error) {
        console.error('必殺技取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeLiff('2001116233-NqaYzJ5R');
  }, []);

  return (
    <div>
      {loading && (
        <div className="overlay">
          <TailSpin
            height={80}
            width={80}
            color="#4fa94d"
            ariaLabel="tail-spin-loading"
            radius={1}
            visible={true}
          />
        </div>
      )}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="勝数ランキング" />
          <Tab label="勝率ランキング" />
        </Tabs>
      </Box>

      {!loading && (
        <div>
          {tabValue === 0 && renderRankingList(data)}
          {tabValue === 1 && renderRankingList(rateData)}
        </div>
      )}
    </div>
  );
}

export default App;
