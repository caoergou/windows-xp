#!/bin/bash

# 合并《给夏灯》精简版各部分

OUTPUT_FILE="src/data/documents/给夏灯-完整版.txt"
BACKUP_FILE="src/data/documents/给夏灯-完整版-备份.txt"

# 备份原文件
if [ -f "$OUTPUT_FILE" ]; then
    echo "备份原文件到 $BACKUP_FILE"
    cp "$OUTPUT_FILE" "$BACKUP_FILE"
fi

# 合并文件
echo "合并精简版各部分..."
cat \
    "src/data/documents/给夏灯-精简版-00-开篇.txt" \
    "src/data/documents/给夏灯-精简版-01-我做了什么.txt" \
    "src/data/documents/给夏灯-精简版-02-我听到的推测的.txt" \
    "src/data/documents/给夏灯-精简版-03-教育理想怎么死的.txt" \
    "src/data/documents/给夏灯-精简版-04-对你的希望.txt" \
    > "$OUTPUT_FILE"

# 统计字数
LINES=$(wc -l < "$OUTPUT_FILE")
CHARS=$(wc -m < "$OUTPUT_FILE")
WORDS_APPROX=$((CHARS / 2))

echo "✅ 合并完成！"
echo "📄 输出文件: $OUTPUT_FILE"
echo "📊 统计信息:"
echo "   - 总行数: $LINES"
echo "   - 总字符数: $CHARS"
echo "   - 约字数: $WORDS_APPROX"
echo ""
echo "💾 原文件已备份到: $BACKUP_FILE"
