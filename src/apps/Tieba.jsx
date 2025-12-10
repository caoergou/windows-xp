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
      background: #fff;
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

  .content {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
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

const Tieba = ({ tiebaId, threadId, navigateTo, currentUrl }) => {
    const [info, setInfo] = useState(null);
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Map tiebaId to folder name
    // Mock mapping logic. In a real scenario, this might be dynamic.
    const tiebaFolder = tiebaId === 'yunshan_no1_middle_school' ? 'yunshan_no1_middle_school' :
                        tiebaId === 'yunshan_county' ? 'yunshan_county' : null;

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

                // Load index info
                const indexData = (await import(`../data/tieba/${tiebaFolder}/index.json`)).default;
                setInfo(indexData);

                // Check for threads (mock logic: check 1.json, 2.json...)
                // In a real app we would have a manifest of threads.
                // Here we will try to load 1, 2, 3... until fail.
                const loadedThreads = [];
                let i = 1;
                while (true) {
                    try {
                        const threadData = (await import(`../data/tieba/${tiebaFolder}/tiezi/${i}.json`)).default;
                        if (threadData && threadData.length > 0) {
                            loadedThreads.push({
                                id: i,
                                title: threadData[0].content.substring(0, 30) + (threadData[0].content.length > 30 ? '...' : ''),
                                author: threadData[0].username,
                                replyCount: threadData.length - 1,
                                posts: threadData
                            });
                        }
                        i++;
                    } catch (e) {
                        break; // No more threads
                    }
                }
                setThreads(loadedThreads);

                if (threadId) {
                    const found = loadedThreads.find(t => t.id === threadId);
                    if (found) {
                        setActiveThread(found);
                    } else {
                        // Fallback if thread not found in loaded list?
                        // Or maybe it's out of range.
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

    const getDefaultAvatar = () => 'https://img.icons8.com/color/48/user-group-man-man.png';
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
                                    const avatar = post.avatar || getDefaultAvatar();

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
                        <PostList>
                            {threads.map(thread => (
                                <PostItem key={thread.id} onClick={() => handleThreadClick(thread)}>
                                    <div className="reply-count">{thread.replyCount}</div>
                                    <div className="title">{thread.title}</div>
                                    <div className="author">{thread.author || 'Anonymous'}</div>
                                </PostItem>
                            ))}
                            {threads.length === 0 && <div style={{padding: '20px', textAlign: 'center'}}>暂无帖子</div>}
                        </PostList>
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
