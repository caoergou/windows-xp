import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useModal } from '../context/ModalContext';
import { getPuzzleIdFromAlbum, getPuzzleIdFromBlog, isAuxiliaryPuzzle } from '../utils/puzzleMapping';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%23666'%3EImage Not Found%3C/text%3E%3C/svg%3E";

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #F8F8F8;
  font-family: Arial, sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
  color: #333;
  position: relative;
  box-sizing: border-box;
`;

const Header = styled.div`
  background-color: #5F97D3;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #2B578F;
  box-sizing: border-box;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
`;

const Nav = styled.div`
  background-color: #333;
  color: white;
  padding: 8px 20px;
  display: flex;
  gap: 20px;
  font-size: 14px;
  box-sizing: border-box;
`;

const NavItem = styled.span`
  cursor: pointer;
  padding: 5px 10px;
  background: ${props => props.active ? '#5F97D3' : 'transparent'};
  border-radius: 4px;

  &:hover {
    background: #555;
  }
`;

const Content = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.div`
  background: white;
  border: 1px solid #ddd;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;

  img {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  div {
    display: flex;
    flex-direction: column;
  }

  h2 {
    margin: 0 0 5px 0;
    color: #333;
  }

  p {
    margin: 0;
    color: #666;
  }
`;

const ShuoshuoItem = styled.div`
  border-bottom: 1px solid #eee;
  padding: 15px 0;

  &:last-child {
    border-bottom: none;
  }

  .time {
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
  }

  .content {
    font-size: 14px;
    line-height: 1.5;
  }

  .comments {
    margin-top: 10px;
    background: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
  }
`;

const BlogItem = styled.div`
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;

  &:hover {
    background: #fcfcfc;
  }

  h3 {
    margin: 0 0 5px 0;
    color: #2B578F;
    font-size: 16px;
  }

  .meta {
    font-size: 12px;
    color: #999;
  }
`;

const AlbumGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const AlbumCard = styled.div`
  width: 150px;
  cursor: pointer;

  .cover {
    width: 150px;
    height: 150px;
    background: #eee;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
    margin-bottom: 5px;
    position: relative;
    overflow: hidden;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
  }

  .name {
    text-align: center;
    font-size: 14px;
    color: #333;
  }

  .locked-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
  }
`;


const DetailView = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 50;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const BackButton = styled.button`
  align-self: flex-start;
  margin-bottom: 20px;
  padding: 5px 15px;
  cursor: pointer;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  &:hover { background: #e0e0e0; }
`;

const BlogDetail = styled.div`
    h2 { color: #2B578F; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .meta { color: #999; font-size: 12px; margin-bottom: 20px; }
    .content { line-height: 1.6; white-space: pre-wrap; }
`;

const PhotoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;

    img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
    }
`;

const NotOpenedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 16px;
  background-color: #f0f0f0;
  padding: 20px;
  text-align: center;

  h2 {
    color: #333;
    margin-bottom: 10px;
  }
`;

const QZone = ({ userId = "1002" }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [userInfo, setUserInfo] = useState(null);
  const [shuoshuos, setShuoshuos] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notOpened, setNotOpened] = useState(false);

  const { showModal, showPasswordDialog } = useModal();

  // Detail view state
  const [viewingItem, setViewingItem] = useState(null); // { type: 'blog'|'album', data: ... }

  useEffect(() => {
    const loadLegacyAlbums = async (userDir) => {
      let albumsData = [];

      if (userDir === "1001") {
        const lifeMeta = (await import('../data/qzone/1001/pictures/life/index.json')).default;
        const lifePic1 = (await import('../data/qzone/1001/pictures/life/pic1.jpg')).default;
        const secretMeta = (await import('../data/qzone/1001/pictures/secret/index.json')).default;
        const secretPic = (await import('../data/qzone/1001/pictures/secret/secret.jpg')).default;

        albumsData = [
          { ...lifeMeta, id: 'life', coverImg: lifePic1, images: [lifePic1] },
          { ...secretMeta, id: 'secret', coverImg: secretPic, images: [secretPic] }
        ];
      } else if (userDir === "1002") {
        const travelMeta = (await import('../data/qzone/1002/pictures/travel/index.json')).default;
        albumsData = [
          { ...travelMeta, id: 'travel', coverImg: PLACEHOLDER_IMAGE, images: [] }
        ];
      }

      return albumsData;
    };

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotOpened(false);
        setViewingItem(null);
        setActiveTab('home');

        const userMap = {
          "1847592036": "xiadeng",
          "1031678254": "linxiaoyu",
          "1562340897": "chenmo",
          "1001": "1001",
          "1002": "1002"
        };

        const userDir = userMap[userId];
        if (!userDir) {
          setNotOpened(true);
          return;
        }

        // 使用 Promise.all 并行加载数据
        const [indexData, shuoshuoData, blogData] = await Promise.all([
          import(`../data/qzone/${userDir}/index.json`),
          import(`../data/qzone/${userDir}/shuoshuo.json`),
          import(`../data/qzone/${userDir}/blog.json`)
        ]);

        // 处理加密日记
        let processedBlogs = blogData.default;
        if (userDir === "linxiaoyu") {
          try {
            const encryptedDiary = await import(`../data/qzone/${userDir}/encrypted_diary.json`);
            processedBlogs.push({
              id: "encrypted_diary",
              title: encryptedDiary.default.title,
              time: "2016-02-15",
              content: encryptedDiary.default.content,
              encrypted: true,
              password: encryptedDiary.default.password
            });
          } catch (e) {
            console.log("No encrypted diary found");
          }
        }

        setUserInfo(indexData.default);
        setShuoshuos(shuoshuoData.default);
        setBlogs(processedBlogs);

        // 加载相册数据
        if (userDir === "1001" || userDir === "1002") {
          const albumsData = await loadLegacyAlbums(userDir);
          setAlbums(albumsData);
        } else {
          try {
            const albumsData = await import(`../data/qzone/${userDir}/albums.json`);
            setAlbums(albumsData.default);
          } catch (e) {
            console.log(`No albums for ${userDir}`);
            setAlbums([]);
          }
        }

      } catch (err) {
        console.error("QZone Data Load Error:", err);
        setError(`Failed to load QZone data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  const openItem = (type, item) => {
      setViewingItem({ type, data: item });
  };

  const handleUnlock = async (type, item) => {
      // If password is in the item, use it. Otherwise default to "123" for backward compatibility/testing
      const correctPassword = item.password || "123";

      // 确定 puzzleId
      let puzzleId = null;
      if (type === 'album') {
          puzzleId = getPuzzleIdFromAlbum(item.name, userId);
      } else if (type === 'blog') {
          puzzleId = getPuzzleIdFromBlog(item.title, userId);
      }

      const allowSkip = puzzleId ? isAuxiliaryPuzzle(puzzleId) : false;

      const success = await showPasswordDialog({
          title: "加密内容",
          message: "此内容已加密，请输入密码访问",
          correctPassword: correctPassword,
          puzzleId: puzzleId,
          allowSkip: allowSkip
      });

      if (success) {
          openItem(type, item);
      }
  };

  const handleBlogClick = (blog) => {
      if (blog.encrypted) {
          handleUnlock('blog', blog);
      } else {
          openItem('blog', blog);
      }
  };

  const handleAlbumClick = (album) => {
      if (album.encrypted) {
          handleUnlock('album', album);
      } else {
          openItem('album', album);
      }
  };

  if (loading) return <Container>Loading...</Container>;

  if (notOpened) {
      return (
          <Container>
              <Header>
                  <Title>QZone</Title>
              </Header>
              <NotOpenedContainer>
                  <h2>该用户尚未开通QQ空间</h2>
                  <p>User has not activated QZone.</p>
              </NotOpenedContainer>
          </Container>
      );
  }

  if (error) return <Container>{error}</Container>;

  return (
    <Container>
      {viewingItem ? (
          <DetailView>
              <BackButton onClick={() => setViewingItem(null)}>← Back</BackButton>
              {viewingItem.type === 'blog' && (
                  <BlogDetail>
                      <h2>{viewingItem.data.title}</h2>
                      <div className="meta">Posted on {viewingItem.data.time}</div>
                      <div className="content">{viewingItem.data.content}</div>
                  </BlogDetail>
              )}
              {viewingItem.type === 'album' && (
                  <div>
                      <h2 style={{color: '#2B578F', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>{viewingItem.data.name}</h2>
                      <PhotoGrid>
                          {viewingItem.data.images && viewingItem.data.images.map((img, idx) => (
                              <img key={idx} src={img} alt={`photo-${idx}`} onClick={() => window.open(img, '_blank')} title="Click to open full size"/>
                          ))}
                          {(!viewingItem.data.images || viewingItem.data.images.length === 0) && <p>No images in this album.</p>}
                      </PhotoGrid>
                  </div>
              )}
          </DetailView>
      ) : (
          <>
            <Header>
                <Title>{userInfo.title}</Title>
                <div>Welcome, Guest</div>
            </Header>

            <Nav>
                <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')}>主页 (Home)</NavItem>
                <NavItem active={activeTab === 'blog'} onClick={() => setActiveTab('blog')}>日志 (Blog)</NavItem>
                <NavItem active={activeTab === 'album'} onClick={() => setActiveTab('album')}>相册 (Album)</NavItem>
                <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>个人档 (Profile)</NavItem>
            </Nav>

            <Content>
                <UserInfo>
                    <img src={userInfo.avatar} alt="avatar" />
                    <div>
                        <h2>{userInfo.username}</h2>
                        <p>{userInfo.description}</p>
                    </div>
                </UserInfo>

                {activeTab === 'home' && (
                    <Section>
                        <h3>说说 (Status Updates)</h3>
                        {shuoshuos.length > 0 ? (
                            shuoshuos.map(item => (
                                <ShuoshuoItem key={item.id}>
                                    <div className="content">{item.content}</div>
                                    <div className="time">{item.time}</div>
                                    {item.comments && item.comments.length > 0 && (
                                        <div className="comments">
                                            {item.comments.map((c, i) => (
                                                <div key={i}><b>{c.user}:</b> {c.content}</div>
                                            ))}
                                        </div>
                                    )}
                                </ShuoshuoItem>
                            ))
                        ) : (
                            <div style={{color: '#999', textAlign: 'center'}}>No status updates.</div>
                        )}
                    </Section>
                )}

                {activeTab === 'blog' && (
                    <Section>
                        <h3>日志 (Blogs)</h3>
                        {blogs.length > 0 ? (
                            blogs.map(blog => (
                                <BlogItem key={blog.id} onClick={() => handleBlogClick(blog)}>
                                    <h3>{blog.title} {blog.encrypted && "🔒"}</h3>
                                    <div className="meta">{blog.time}</div>
                                </BlogItem>
                            ))
                         ) : (
                            <div style={{color: '#999', textAlign: 'center'}}>No blogs.</div>
                        )}
                    </Section>
                )}

                {activeTab === 'album' && (
                    <Section>
                        <h3>相册 (Albums)</h3>
                        <AlbumGrid>
                            {albums.length > 0 ? (
                                albums.map(album => (
                                    <AlbumCard key={album.id} onClick={() => handleAlbumClick(album)}>
                                        <div className="cover">
                                            {album.encrypted && <div className="locked-overlay">Locked</div>}
                                            {!album.encrypted && album.coverImg && <img src={album.coverImg} alt={album.name}/>}
                                            {!album.encrypted && !album.coverImg && <span>No Cover</span>}
                                        </div>
                                        <div className="name">{album.name}</div>
                                    </AlbumCard>
                                ))
                            ) : (
                                <div style={{width: '100%', color: '#999', textAlign: 'center'}}>No albums.</div>
                            )}
                        </AlbumGrid>
                    </Section>
                )}

                {activeTab === 'profile' && (
                    <Section>
                        <h3>个人档</h3>
                        <p>Name: {userInfo.username}</p>
                        <p>Description: {userInfo.description}</p>
                    </Section>
                )}

            </Content>
          </>
      )}

    </Container>
  );
};

export default QZone;
