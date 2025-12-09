import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    width: 100%;
    height: 100%;
    background: #EBF2F9;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
`;

const Header = styled.div`
    width: 100%;
    height: 100px;
    background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tencent_QQ_logo_2016.svg/1024px-Tencent_QQ_logo_2016.svg.png') no-repeat center;
    background-size: contain;
    margin-top: 30px;
    margin-bottom: 20px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 200px;
`;

const Input = styled.input`
    padding: 5px;
    border: 1px solid #7F9DB9;
    border-radius: 2px;
`;

const Button = styled.button`
    margin-top: 10px;
    padding: 5px;
    background: #0099FF;
    color: white;
    border: 1px solid #0066CC;
    border-radius: 3px;
    cursor: pointer;
    font-weight: bold;
    
    &:hover {
        background: #33ADFF;
    }
    
    &:active {
        background: #007ACC;
    }
`;

const Links = styled.div`
    margin-top: 20px;
    font-size: 12px;
    color: #0066CC;
    display: flex;
    gap: 10px;
    cursor: pointer;
    
    span:hover {
        text-decoration: underline;
    }
`;

const QQ = () => {
    const [status, setStatus] = useState('login'); // login, logging_in, logged_in

    const handleLogin = () => {
        setStatus('logging_in');
        setTimeout(() => {
            setStatus('logged_in');
        }, 1500);
    };

    if (status === 'logged_in') {
        return (
            <Container style={{justifyContent: 'flex-start', padding: '10px'}}>
                <div style={{display:'flex', alignItems:'center', width:'100%', marginBottom:'10px'}}>
                     <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/User_Circle.png/480px-User_Circle.png" style={{width:'40px', marginRight:'10px'}}/>
                     <div>
                         <div style={{fontWeight:'bold'}}>我的 QQ</div>
                         <div style={{fontSize:'12px', color:'gray'}}>在线</div>
                     </div>
                </div>
                <div style={{width:'100%', borderTop:'1px solid #ccc', paddingTop:'10px'}}>
                     <div style={{padding:'5px', fontWeight:'bold'}}>好友</div>
                     <div style={{padding:'5px', paddingLeft:'15px', display:'flex', alignItems:'center'}}>
                        <div style={{width:'8px', height:'8px', background:'green', borderRadius:'50%', marginRight:'5px'}}></div>
                        山月
                     </div>
                     <div style={{padding:'5px', paddingLeft:'15px', display:'flex', alignItems:'center'}}>
                        <div style={{width:'8px', height:'8px', background:'gray', borderRadius:'50%', marginRight:'5px'}}></div>
                        用户 A
                     </div>
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <Header />
            <InputGroup>
                <Input type="text" placeholder="QQ号码/手机/邮箱" />
                <Input type="password" placeholder="密码" />
                <div style={{display:'flex', fontSize:'12px', alignItems:'center'}}>
                    <input type="checkbox" id="rem" /> <label htmlFor="rem">记住密码</label>
                </div>
                <Button onClick={handleLogin}>
                    {status === 'logging_in' ? '登录中...' : '登录'}
                </Button>
            </InputGroup>
            <Links>
                <span>找回密码</span>
                <span>注册账号</span>
            </Links>
        </Container>
    );
};

export default QQ;
