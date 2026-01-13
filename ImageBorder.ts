const {ccclass, property} = cc._decorator;

@ccclass
export default class ImageBorder extends cc.Component {
    
    @property(cc.SpriteFrame)
    spriteFrame: cc.SpriteFrame = null; // 要显示的图片

    @property
    width: number = 95;  // 宽度（默认95）

    @property
    height: number = 95; // 高度（默认95）

    @property
    radius: number = 10; // 圆角半径

    @property({
        tooltip: '是否使用圆形遮罩（忽略 radius 设置）'
    })
    useCircle: boolean = false;

    @property
    borderWidth: number = 0; // 边框宽度（0为无边框）

    @property
    borderColor: cc.Color = cc.Color.WHITE; // 边框颜色

    private containerNode: cc.Node = null;
    private renderNode: cc.Node = null;
    private borderNode: cc.Node = null;

    start() {
        let existingSprite = this.node.getComponent(cc.Sprite);
        if (existingSprite) {
            existingSprite.spriteFrame = null;
            existingSprite.enabled = false;
        }
        
        this.createRoundedImage();
    }

    createRoundedImage() {
        this.node.removeAllChildren();
        
        this.containerNode = new cc.Node('container');
        this.containerNode.setPosition(0, 0);
        this.node.addChild(this.containerNode);
        
        if (this.borderWidth > 0) {
            this.createBorder();
        }
        
        this.createRoundedImageWithRenderTexture();
    }

    /**
     * 使用 RenderTexture 创建圆角图片
     */
    private createRoundedImageWithRenderTexture() {
        // 创建渲染节点
        this.renderNode = new cc.Node('render');
        this.renderNode.setPosition(0, 0);
        
        // 创建 canvas 绘制圆角图片
        let canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        let ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.spriteFrame && this.spriteFrame.getTexture()) {
            let texture = this.spriteFrame.getTexture();
            let img = texture.getHtmlElementObj();
            
            if (img) {
                if (this.useCircle) {
                    const centerX = this.width / 2;
                    const centerY = this.height / 2;
                    const radius = Math.min(centerX, centerY);
                    
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.closePath();
                } else {
                    const maxRadius = Math.min(this.width / 2, this.height / 2);
                    const r = Math.min(this.radius, maxRadius);
                    
                    ctx.beginPath();
                    ctx.moveTo(r, 0);
                    ctx.lineTo(this.width - r, 0);
                    ctx.quadraticCurveTo(this.width, 0, this.width, r);
                    ctx.lineTo(this.width, this.height - r);
                    ctx.quadraticCurveTo(this.width, this.height, this.width - r, this.height);
                    ctx.lineTo(r, this.height);
                    ctx.quadraticCurveTo(0, this.height, 0, this.height - r);
                    ctx.lineTo(0, r);
                    ctx.quadraticCurveTo(0, 0, r, 0);
                    ctx.closePath();
                }
                
                ctx.clip();
                
                let rect = this.spriteFrame.getRect();
                ctx.drawImage(img, 
                    rect.x, rect.y, rect.width, rect.height,
                    0, 0, this.width, this.height
                );
            } else {
                console.warn('Image element not found');
            }
        }
        
        // 创建纹理
        let resultTexture = new cc.Texture2D();
        resultTexture.initWithElement(canvas);
        resultTexture.handleLoadedTexture();
        
        // 创建 SpriteFrame
        let resultSpriteFrame = new cc.SpriteFrame(resultTexture);
        
        // 添加 Sprite 显示结果
        let sprite = this.renderNode.addComponent(cc.Sprite);
        sprite.spriteFrame = resultSpriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        
        this.renderNode.setContentSize(this.width, this.height);
        this.renderNode.setAnchorPoint(0.5, 0.5);
        
        this.containerNode.addChild(this.renderNode);
    }

    /**
     * 创建边框
     */
    private createBorder() {
        if (this.borderNode) {
            this.borderNode.destroy();
        }
        
        this.borderNode = new cc.Node('border');
        this.borderNode.setPosition(0, 0);
        
        let borderGraphics = this.borderNode.addComponent(cc.Graphics);
        this.drawRoundedRectBorder(borderGraphics, this.width, this.height, this.radius);
        
        this.containerNode.addChild(this.borderNode);
    }

    /**
     * 绘制圆角矩形边框（使用 stroke）
     */
    private drawRoundedRectBorder(graphics: cc.Graphics, width: number, height: number, radius: number) {
        graphics.clear();
        graphics.lineWidth = this.borderWidth;
        graphics.strokeColor = this.borderColor;
        
        if (this.useCircle) {
            // 绘制圆形边框
            const centerX = 0;
            const centerY = 0;
            const r = Math.min(width / 2, height / 2);
            
            graphics.circle(centerX, centerY, r);
            graphics.stroke();
        } else {
            // 绘制圆角矩形边框
            const halfWidth = width / 2;
            const halfHeight = height / 2;
            
            // 限制圆角半径不超过宽高的一半
            const maxRadius = Math.min(halfWidth, halfHeight);
            const r = Math.min(radius, maxRadius);
            
            // 从左上角圆角结束位置开始
            graphics.moveTo(-halfWidth + r, -halfHeight);
            
            // 上边 → 右上角
            graphics.lineTo(halfWidth - r, -halfHeight);
            graphics.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + r);
            
            // 右边 → 右下角
            graphics.lineTo(halfWidth, halfHeight - r);
            graphics.quadraticCurveTo(halfWidth, halfHeight, halfWidth - r, halfHeight);
            
            // 下边 → 左下角
            graphics.lineTo(-halfWidth + r, halfHeight);
            graphics.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - r);
            
            // 左边 → 左上角
            graphics.lineTo(-halfWidth, -halfHeight + r);
            graphics.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + r, -halfHeight);
            
            graphics.close();
            graphics.stroke();
        }
    }

    /**
     * 运行时更换图片
     */
    public setSpriteFrame(newSpriteFrame: cc.SpriteFrame) {
        this.spriteFrame = newSpriteFrame;
        this.createRoundedImage();
    }

    /**
     * 运行时修改尺寸
     */
    public setSize(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.createRoundedImage();
    }

    /**
     * 运行时修改圆角半径
     */
    public setRadius(newRadius: number) {
        this.radius = newRadius;
        this.createRoundedImage();
    }
}
