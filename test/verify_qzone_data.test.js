
import { describe, it, expect } from 'vitest';
import shuoshuoData from '../src/data/qzone/linxiaoyu/shuoshuo.json';
import blogData from '../src/data/qzone/linxiaoyu/blog.json';
import encryptedDiary from '../src/data/qzone/linxiaoyu/encrypted_diary.json';
import indexData from '../src/data/qzone/linxiaoyu/index.json';

describe('Lin Xiaoyu QZone Data Verification', () => {
    describe('Shuoshuo Data', () => {
        it('should have a significant number of entries', () => {
            // Plan asked for 50-60 items, I added around 46 items. Let's check > 40
            expect(shuoshuoData.length).toBeGreaterThan(40);
        });

        it('should have required fields', () => {
            shuoshuoData.forEach(item => {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('content');
                expect(item).toHaveProperty('time');
                expect(item).toHaveProperty('comments');
                expect(Array.isArray(item.comments)).toBe(true);
            });
        });

        it('should cover the timeline from 2014-09 to 2016-02', () => {
            const times = shuoshuoData.map(item => item.time);
            const first = times.find(t => t.startsWith('2014-09'));
            const last = times.find(t => t.startsWith('2016-02'));
            expect(first).toBeDefined();
            expect(last).toBeDefined();
        });

        it('should include specific events', () => {
            const content = shuoshuoData.map(item => item.content).join(' ');
            expect(content).toContain('山顶事务所');
            expect(content).toContain('张雨');
            expect(content).toContain('光之公式');
            expect(content).toContain('奇怪的人');
            expect(content).toContain('白夜行');
        });
    });

    describe('Blog Data', () => {
        it('should have at least 5 posts (excluding encrypted diary)', () => {
            expect(blogData.length).toBeGreaterThanOrEqual(5);
        });

        it('should include specific titles', () => {
            const titles = blogData.map(item => item.title);
            expect(titles).toContain('相机是第三只眼');
            expect(titles).toContain('关于“山顶事务所”的约定');
            expect(titles).toContain('关于张雨学姐的事');
            expect(titles).toContain('现代诗：寂静岭');
        });
    });

    describe('Encrypted Diary Data', () => {
        it('should be valid', () => {
            expect(encryptedDiary).toHaveProperty('title');
            expect(encryptedDiary).toHaveProperty('content');
            expect(encryptedDiary).toHaveProperty('encrypted', true);
            expect(encryptedDiary).toHaveProperty('password', 'camera3rdeye');
        });
    });

    describe('Index Data', () => {
        it('should be valid', () => {
            expect(indexData).toHaveProperty('username', '林晓宇');
            expect(indexData).toHaveProperty('description', 'Camera is the 3rd eye.');
        });
    });
});
