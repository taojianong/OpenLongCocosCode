/**
 * 创建测试 PSD 文件
 */
const fs = require('fs');
const { writePsd } = require('ag-psd');

// 创建一个简单的 PSD 文件，包含 com_ 图层
const psd = {
    width: 750,
    height: 1334,
    children: [
        {
            name: 'background',
            left: 0,
            top: 0,
            right: 750,
            bottom: 1334,
            canvas: createCanvas(750, 1334, [100, 100, 100, 255])
        },
        {
            name: 'com_testComponent',
            left: 50,
            top: 50,
            right: 700,
            bottom: 200,
            canvas: createCanvas(650, 150, [200, 200, 200, 255])
        },
        {
            name: 'node_bottom',
            children: [
                {
                    name: 'btn_close',
                    left: 650,
                    top: 1250,
                    right: 730,
                    bottom: 1310,
                    canvas: createCanvas(80, 60, [255, 100, 100, 255])
                }
            ]
        }
    ]
};

function createCanvas(width, height, color) {
    const canvas = {
        width: width,
        height: height
    };

    // 创建 ImageData
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = color[0];     // R
        data[i + 1] = color[1]; // G
        data[i + 2] = color[2]; // B
        data[i + 3] = color[3]; // A
    }

    canvas.getContext = () => ({
        getImageData: () => ({ data, width, height })
    });

    return canvas;
}

// 写入 PSD 文件
const arrayBuffer = writePsd(psd);
const buffer = Buffer.from(arrayBuffer);
fs.writeFileSync('psd/UI_TestWithComponent.psd', buffer);
console.log('✅ 创建测试 PSD 文件: psd/UI_TestWithComponent.psd');
