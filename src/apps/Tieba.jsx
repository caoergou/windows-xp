import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #F5F7FA;
  font-family: Arial, sans-serif;
  overflow-y: auto;
  color: #333;
`;

const Header = styled.div`
  background: url('https://img.icons8.com/color/96/baidu.png') no-repeat 20px center;
  background-size: 50px;
  background-color: #fff;
  padding: 15px 15px 15px 80px;
  border-bottom: 1px solid #dcdcdc;
  display: flex;
  align-items: center;

  h1 {
    font-size: 24px;
    margin: 0;
    color: #2d64b3;
    font-weight: bold;
  }

  .desc {
    color: #666;
    margin-left: 20px;
    font-size: 14px;
  }

  .stats {
      margin-left: auto;
      font-size: 12px;
      color: #999;

      span {
          margin-left: 10px;
          color: #ff6600;
          font-weight: bold;
      }
  }
`;

const MainContent = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
`;

const LeftColumn = styled.div`
  flex: 3;
`;

const RightColumn = styled.div`
  flex: 1;
`;

const PostList = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
`;

const PostItem = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #f2f2f2;
  display: flex;
  align-items: flex-start;
  cursor: pointer;

  &:hover {
    background-color: #fcfcfc;
  }

  .reply-count {
      background: #fbfbfb;
      border: 1px solid #f0f0f0;
      width: 40px;
      text-align: center;
      margin-right: 15px;
      color: #666;
      font-size: 13px;
      padding: 2px 0;
  }

  .title {
      font-size: 14px;
      color: #2d64b3;
      text-decoration: none;
      flex: 1;

      &:hover {
          text-decoration: underline;
      }
  }

  .author {
      font-size: 12px;
      color: #999;
      width: 100px;
      text-align: right;
  }
`;

const ThreadView = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  margin-bottom: 20px;
`;

const PostFloor = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e5e5;

  &:last-child {
      border-bottom: none;
  }
`;

const UserSide = styled.div`
  width: 130px;
  background: #fbfbfb;
  padding: 15px;
  text-align: center;
  border-right: 1px solid #e5e5e5;

  img {
      width: 80px;
      height: 80px;
      border: 1px solid #ccc;
      padding: 1px;
      background: #e8e8e8;
  }

  .username {
      margin-top: 10px;
      color: #2d64b3;
      font-size: 12px;
      word-break: break-all;
  }
`;

const ContentSide = styled.div`
  flex: 1;
  padding: 15px 20px;
  position: relative;
  min-height: 150px;
  user-select: text;

  .content {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      cursor: text;
  }

  .footer {
      position: absolute;
      bottom: 10px;
      right: 20px;
      font-size: 12px;
      color: #999;
  }
`;

const Breadcrumb = styled.div`
    margin-bottom: 10px;
    font-size: 12px;

    a {
        color: #2d64b3;
        text-decoration: none;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }

    span {
        margin: 0 5px;
        color: #666;
    }
`;

const Pagination = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 15px 0;
    gap: 4px;

    button {
        min-width: 32px;
        height: 28px;
        border: 1px solid #ddd;
        background: #fff;
        color: #333;
        font-size: 12px;
        cursor: pointer;
        padding: 0 8px;

        &:hover:not(:disabled) {
            background: #f0f0f0;
            border-color: #2d64b3;
            color: #2d64b3;
        }

        &.active {
            background: #2d64b3;
            color: #fff;
            border-color: #2d64b3;
        }

        &:disabled {
            color: #ccc;
            cursor: default;
        }
    }
`;

// Define glob patterns at the top level
const tiebaContentGlob = import.meta.glob('../data/tieba/*/tiezi/*.json');
const tiebaIndexGlob = import.meta.glob('../data/tieba/*/index.json');

const Tieba = ({ tiebaId, threadId, navigateTo, currentUrl }) => {
    const [info, setInfo] = useState(null);
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const POSTS_PER_PAGE = 10;

    // Map tiebaId to folder name - directly use tiebaId as folder name
    const tiebaFolder = tiebaId;

    useEffect(() => {
        if (!tiebaFolder) {
            setError('Tieba not found');
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load index info using glob to ensure it's bundled
                const indexKey = Object.keys(tiebaIndexGlob).find(k => k.includes(`/${tiebaFolder}/index.json`));
                if (!indexKey) throw new Error("Index file not found");

                const indexData = (await tiebaIndexGlob[indexKey]()).default;
                setInfo(indexData);

                // Load threads from glob manifest
                const loadedThreads = [];
                // Filter keys that belong to this tieba's 'tiezi' folder
                const relevantKeys = Object.keys(tiebaContentGlob).filter(k => k.includes(`/${tiebaFolder}/tiezi/`));

                for (const key of relevantKeys) {
                    try {
                        // Extract ID from filename
                        const match = key.match(/\/(\d+)\.json$/);
                        if (match) {
                            const id = parseInt(match[1], 10);
                            const threadModule = await tiebaContentGlob[key]();
                            const threadData = threadModule.default;

                            if (threadData && threadData.length > 0) {
                                loadedThreads.push({
                                    id: id,
                                    title: threadData[0].content.substring(0, 30) + (threadData[0].content.length > 30 ? '...' : ''),
                                    author: threadData[0].username,
                                    time: threadData[0].time,
                                    replyCount: threadData.length - 1,
                                    posts: threadData
                                });
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to load thread ${key}`, e);
                    }
                }

                // Sort threads by last reply time (newest first)
                loadedThreads.sort((a, b) => {
                    const aLastTime = a.posts[a.posts.length - 1]?.time || a.time;
                    const bLastTime = b.posts[b.posts.length - 1]?.time || b.time;
                    return bLastTime.localeCompare(aLastTime);
                });
                setThreads(loadedThreads);

                if (threadId) {
                    const found = loadedThreads.find(t => t.id === parseInt(threadId));
                    if (found) {
                        setActiveThread(found);
                    } else {
                        // Fallback if thread not found in loaded list
                        setActiveThread(null);
                    }
                } else {
                    setActiveThread(null);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
                setLoading(false);
            }
        };

        loadData();
    }, [tiebaFolder, threadId]);

    const handleThreadClick = (thread) => {
        // Use navigateTo instead of local state
        if (navigateTo) {
            // Construct new URL
            // Current URL might have query params or be just base.
            // We assume base is http://tieba.com/tiebaId
            const baseUrl = `http://tieba.com/${tiebaId}`;
            navigateTo(`${baseUrl}/p/${thread.id}`);
        } else {
            // Fallback for standalone usage if any
            setActiveThread(thread);
        }
    };

    const handleBack = () => {
        if (navigateTo) {
            const baseUrl = `http://tieba.com/${tiebaId}`;
            navigateTo(baseUrl);
        } else {
            setActiveThread(null);
        }
    };

    const getAvatarForUser = (name) => {
        const bgs = ['#4a90d9','#e6794a','#67b168','#d94a7a','#9b59b6','#e6a23c','#3498db','#1abc9c','#e74c3c','#2ecc71','#f39c12','#8e44ad'];
        const fgs = ['#fff3','#fff4','#fff2'];
        let h = 0;
        for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
        const bg = bgs[Math.abs(h) % bgs.length];
        const fg = fgs[Math.abs(h >> 4) % fgs.length];
        const p = Math.abs(h);
        // Generate a simple geometric pattern based on hash
        const shapes = [
            `<circle cx="${12 + (p % 24)}" cy="${12 + ((p >> 3) % 24)}" r="${8 + (p % 6)}" fill="${fg}"/>`,
            `<rect x="${(p >> 1) % 20}" y="${(p >> 2) % 20}" width="${14 + (p % 10)}" height="${14 + ((p >> 1) % 10)}" rx="3" fill="${fg}"/>`,
            `<circle cx="${30 - (p % 16)}" cy="${30 - ((p >> 2) % 16)}" r="${6 + ((p >> 3) % 8)}" fill="${fg}"/>`
        ];
        const s1 = shapes[p % 3];
        const s2 = shapes[(p >> 4) % 3];
        return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="${bg}"/>${s1}${s2}</svg>`)}`;
    };
    const getDefaultName = () => `Tieba User ${Math.floor(Math.random() * 1000)}`;

    if (loading) return <Container>Loading...</Container>;
    if (error) return <Container>Error: {error}</Container>;
    if (!info) return <Container>Tieba info not available</Container>;

    return (
        <Container>
            <Header>
                <h1>{info.name}吧</h1>
                <span className="desc">{info.description}</span>
                <div className="stats">
                    关注: <span>{info.followers}</span>
                    帖子: <span>{info.posts}</span>
                </div>
            </Header>

            <MainContent>
                <LeftColumn>
                    {activeThread ? (
                        <>
                            <Breadcrumb>
                                <a onClick={handleBack}>{info.name}吧</a>
                                <span>&gt;</span>
                                <span>帖子详情</span>
                            </Breadcrumb>
                            <ThreadView>
                                <h2 style={{padding: '15px', margin: 0, fontSize: '16px', borderBottom: '1px solid #e5e5e5'}}>{activeThread.title}</h2>
                                {activeThread.posts.map((post, idx) => {
                                    const username = post.username || `Tieba User_${Math.random().toString(36).substr(2, 5)}`;
                                    const avatar = post.avatar || getAvatarForUser(username);

                                    return (
                                        <PostFloor key={post.id || idx}>
                                            <UserSide>
                                                <img src={avatar} alt="avatar" />
                                                <div className="username">{username}</div>
                                            </UserSide>
                                            <ContentSide>
                                                <div className="content">{post.content}</div>
                                                <div className="footer">{idx + 1}楼 {post.time}</div>
                                            </ContentSide>
                                        </PostFloor>
                                    );
                                })}
                            </ThreadView>
                        </>
                    ) : (
                        <>
                        <PostList>
                            {threads
                                .slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)
                                .map(thread => (
                                <PostItem key={thread.id} onClick={() => handleThreadClick(thread)}>
                                    <div className="reply-count">{thread.replyCount}</div>
                                    <div className="title">{thread.title}</div>
                                    <div className="author">{thread.time?.split(' ')[0]} {thread.author || 'Anonymous'}</div>
                                </PostItem>
                            ))}
                            {threads.length === 0 && <div style={{padding: '20px', textAlign: 'center'}}>暂无帖子</div>}
                        </PostList>
                        {threads.length > POSTS_PER_PAGE && (
                            <Pagination>
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</button>
                                {Array.from({length: Math.ceil(threads.length / POSTS_PER_PAGE)}, (_, i) => i + 1).map(page => (
                                    <button key={page} className={page === currentPage ? 'active' : ''} onClick={() => setCurrentPage(page)}>{page}</button>
                                ))}
                                <button disabled={currentPage === Math.ceil(threads.length / POSTS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)}>下一页</button>
                            </Pagination>
                        )}
                        </>
                    )}
                </LeftColumn>

                <RightColumn>
                    <div style={{background: '#fff', border: '1px solid #e5e5e5', padding: '10px', marginBottom: '20px'}}>
                        <img src={info.avatar || "https://img.icons8.com/color/96/school.png"} alt="Tieba Logo" style={{width: '100%'}}/>
                        <div style={{marginTop: '10px', fontWeight: 'bold', textAlign: 'center'}}>
                            <button style={{background: '#2d64b3', color: 'white', border: 'none', padding: '5px 20px', cursor: 'pointer'}}>+ 关注</button>
                        </div>
                    </div>
                </RightColumn>
            </MainContent>
        </Container>
    );
};

export default Tieba;
