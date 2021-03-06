import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AudioMenu, Broadcasts, BroadCaseLinkList, FixedHeader, Header, UpdateLog, NatoriSana, Button, NotificationArticles } from '..';
import { Container } from './styles';
import { Broadcast, ButtonInfo, Site } from '../../lib/types';
import { AudioContext } from '../../contexts';
import { audioPlayer } from '../../audio-player';
import { getSourceTypeTextAndLink } from '../../lib/getSourceTypeTextAndLink';
import { endpoint, host } from '../../constants';

export type AppProps = {
  sites: Site[];
  buttonInfoList: ButtonInfo[];
  broadcasts: Broadcast[];
};

function getThumbnailUrl(streamId?: string, tweetId?: string): string {
  if (streamId) {
    return `https://img.youtube.com/vi/${streamId}/hqdefault.jpg`;
  } else if (tweetId) {
    return `${host}/images/twitter-logo.png`;
  } else {
    return `${host}/images/thumbnail.png`;
  }
}

function copyUrlToClipboard() {
  const url = document.querySelector<HTMLInputElement>('input#share-url')!;

  url.select();
  document.execCommand('copy');
}

export function App(props: AppProps) {
  const { broadcasts, buttonInfoList, sites } = props;
  const [searchWord, setSearchWord] = useState('');
  const [state, setState] = useContext(AudioContext);
  const [isPlaying, setIsPlaying] = useState(false);

  const logs = useMemo(
    () =>
      broadcasts.map((b) => ({
        name: b.title,
        link: `/#${b.id}`,
        createdAt: new Date(b.createdAt),
        updatedAt: b.updatedAt && new Date(b.updatedAt),
      })),
    [broadcasts],
  );

  const audioTitle = useMemo(() => (state.audioId !== undefined ? buttonInfoList[state.audioId].value : undefined), [state.audioId]);
  const buttonUrl = useMemo(() => (state.audioId !== undefined ? `${endpoint}/#${state.audioId}` : endpoint), [state.audioId]);
  const twitterShareUrl = useMemo(() => {
    if (state.audioId !== undefined) {
      return `https://twitter.com/intent/tweet?text=${audioTitle}&url=${endpoint}/%23${state.audioId}&hashtags=さなボタン`;
    } else {
      return 'https://twitter.com/intent/tweet?text=さなボタン';
    }
  }, [state.audioId, audioTitle, buttonUrl]);

  const searchedButtonIds = useMemo(() => {
    if (searchWord === '') return [];

    return props.buttonInfoList
      .map((buttonInfo, idx) => {
        const searchTexts = searchWord.split(/[\x20\u3000\t]+/);

        const isMatch = searchTexts.map((w) => `${buttonInfo.value}`.includes(w)).some((b) => b);

        return isMatch && idx;
      })
      .filter((b): b is number => !!b);
  }, [props.buttonInfoList, searchWord]);
  const searchedButtonInfos = useMemo(() => {
    return searchedButtonIds.map((id) => [id, buttonInfoList[id]] as [number, ButtonInfo]);
  }, [searchedButtonIds, props.buttonInfoList]);
  // const isShowSearchResult = useMemo(() => searchedButtonIds.length > 0, [searchedButtonInfos]);

  const handleButtonClick = (id: number) => audioPlayer.emitAudioId(id);

  const playCurrentAudio = () => {
    audioPlayer.playCurrentAudio();
  };

  const pause = () => {
    audioPlayer.pause();
  };

  const stop = () => {
    audioPlayer.stop();
  };

  const toggleRandom = (bool: boolean) => {
    audioPlayer.setRandom(bool);
  };
  const toggleRepeat = (bool: boolean) => {
    audioPlayer.setRepeat(bool);
  };

  const onAudioIdEmit = (audioId: number) => {
    const broadcast = broadcasts.find(({ buttonIds }) => buttonIds.includes(audioId));

    if (!broadcast) {
      return;
    }
    const { title, streamId, tweedId } = broadcast;

    const [, link] = getSourceTypeTextAndLink(streamId, tweedId);
    const thumbnailUrl = getThumbnailUrl(streamId, tweedId);

    setState({
      audioId,
      sourceTitle: title,
      sourceLink: link,
      thumbnailUrl,
      streamId,
      tweedId,
    });

    audioPlayer.playNextAudio(audioId);
  };

  const onStartedEmit = () => {
    setIsPlaying(true);
  };

  const onStoppedEmit = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    const audioNameList = buttonInfoList.map((i) => i['file-name']);

    audioPlayer.setAudioNameList(audioNameList);
    audioPlayer.eventEmitter.on('play', onAudioIdEmit);
    audioPlayer.eventEmitter.on('started', onStartedEmit);
    audioPlayer.eventEmitter.on('stopped', onStoppedEmit);
  }, []);

  useEffect(() => {
    const { hash } = window.location;

    if (!hash) {
      return;
    }

    const audioId = Number(hash.slice(1));

    if (Number.isInteger(audioId)) {
      audioPlayer.emitAudioId(audioId);
    }
  }, []);

  return (
    <>
      <Container>
        <FixedHeader onSearch={setSearchWord}>
          {useMemo(
            () => searchedButtonInfos.map(([id, info]) => <Button key={id} id={id} buttonInfo={info} onButtonClick={handleButtonClick} />),
            [searchedButtonInfos],
          )}
        </FixedHeader>
        <Header />
        {/* <SearchResult show={isShowSearchResult}></SearchResult> */}
        <UpdateLog logs={logs} />
        <hr style={{ margin: '1em 0' }} />
        <NotificationArticles buttonInfoList={buttonInfoList} />
        <Broadcasts broadcasts={broadcasts} buttonInfoList={buttonInfoList} onButtonClick={handleButtonClick} />
        <BroadCaseLinkList sites={sites} />
        <NatoriSana />
        {/* <Footer /> */}
      </Container>
      <AudioMenu
        audioTitle={audioTitle}
        sourceTitle={state.sourceTitle}
        thumbnailUrl={state.thumbnailUrl}
        sourceLink={state.sourceLink}
        isPlaying={isPlaying}
        onPlayClick={playCurrentAudio}
        onPauseClick={pause}
        onStopClick={stop}
        onRandomToggle={toggleRandom}
        onRepeatToggle={toggleRepeat}
      >
        <div>
          <div>
            <button>
              <a href={twitterShareUrl}>Twitter でシェア</a>
            </button>
          </div>
          <div>
            <input
              type="url"
              id="share-url"
              value={buttonUrl}
              style={{
                fontSize: '16px',
                transform: 'scale(0.8)',
              }}
            />
            <button onClick={copyUrlToClipboard}>URL をコピー</button>
          </div>
        </div>
      </AudioMenu>
    </>
  );
}
