import $ from "jquery";
import InfiniteGrid from "../../src/InfiniteGrid";
import GridLayout from "../../src/layouts/GridLayout";
import FrameLayout from "../../src/layouts/FrameLayout";
import SquareLayout from "../../src/layouts/SquareLayout";
import PackingLayout from "../../src/layouts/PackingLayout";
import JustifiedLayout from "../../src/layouts/JustifiedLayout";
import {getItems, insert, checkLayoutComplete} from "./helper/TestHelper";
import {APPEND, PREPEND} from "../../src/consts";
import {innerHeight} from "../../src/utils";

describe("InfiniteGrid Test", function() {
  describe("destroy Test", function() {
    [true, false].forEach(isOverflowScroll => {
      beforeEach(() => {
        this.el = sandbox();
        this.el.innerHTML = "<div id='infinite'></div>";
      });
      afterEach(() => {
        cleanup();
      });
      it(`should check a initialization (isOverflowScroll: ${isOverflowScroll})`, done => {
        // Given
        let target = document.getElementById("infinite");
        const beforeStyle = {
          position: target.style.position,
          overflowX: target.style.overflowX,
          overflowY: target.style.overflowY,
          height: target.style.height,
          weight: target.style.weight,
        };
        this.inst = new InfiniteGrid(target, {
          isOverflowScroll,
        });
        this.inst.setLayout(GridLayout);
        
        insert(this.inst, true, () => {
          // When
          this.inst.destroy();

          // Then
          Object.keys(beforeStyle).forEach(v => {
            expect(beforeStyle.position).to.be.eql(target.style.position);
          });  
          done();
        }, 30, 1);
      });
    });
  });

  describe("initailization Test (onlayoutComplete)", function() {
    [true, false].forEach(isOverflowScroll => {
      beforeEach(() => {
        this.el = sandbox();
        this.el.innerHTML = "<div id='infinite'></div>";
        this.inst = new InfiniteGrid("#infinite", {
          isOverflowScroll,
        });
        this.inst.setLayout(GridLayout);
      });
      afterEach(() => {
        if (this.inst) {
          this.inst.destroy();
          this.inst = null;
        }
        cleanup();
      });
      it(`should check a initialization (isOverflowScroll: ${isOverflowScroll})`, done => {
        // Given
        const count = 10;
        const items = getItems(count);
        const layoutCompleteHandler = sinon.spy(function(e) {
          // Then
          expect(e.target).to.have.lengthOf(count);
          expect(this.getItems(true)).to.have.lengthOf(count);
          expect(this.isProcessing()).to.be.false;
          done();
        });
  
        // When
        this.inst.on("layoutComplete", layoutCompleteHandler);
  
        // Then
        expect(this.inst.isProcessing()).to.be.false;
        expect(layoutCompleteHandler.calledOnce).to.be.false;
        
        // When (layout)
        this.inst._renderer.container.innerHTML = items.join("");
        this.inst.layout();
      });
    });
  });

  describe("When scrolling append/prepend event Test", function() {
    [true, false].forEach(isOverflowScroll => {
      beforeEach(() => {
        this.el = sandbox();
        this.el.innerHTML = "<div id='infinite'></div>";
        this.inst = new InfiniteGrid("#infinite", {
          useRecycle: true,
          isOverflowScroll
        });
        this.inst.setLayout(GridLayout);
      });
      afterEach(() => {
        if (this.inst) {
          this.inst.destroy();
          this.inst = null;
        }
        cleanup();
      });
      
      [APPEND, PREPEND].forEach(isAppend => {
        const ITEMCOUNT = 30;
        const RETRY = 7;
        it(`should trigger ${isAppend ? "append" : "prepend"} event when scrolling (isOverflowScroll: ${isOverflowScroll})`, done => {
          console.log("----");
          // Given
          // When
          this.inst.on(isAppend ? "append" : "prepend", param => {
            expect(param.isTrusted).to.a.true;
            expect(param.groupKey).to.be.equal(param.currentTarget.getGroupKeys()[isAppend ? "pop" : "shift"]());
            done();
          });
          const handler = insert(this.inst, isAppend, () => {
            const lastParam = handler.getCall(handler.callCount - 1).args[0];

            if (isAppend) {
              const spot = lastParam.size;
              this.inst._watcher.scrollTo(spot);
            } else {
              this.inst._watcher.scrollTo(0);
            }
          }, ITEMCOUNT, RETRY);
        });
      });
    });
  });  
  describe("When appending/prepending loadingStart/loaingEnd event Test", function() {
    [true, false].forEach(isOverflowScroll => {
      beforeEach(() => {
        this.el = sandbox();
        this.el.innerHTML = "<div id='infinite'></div>";
        this.inst = new InfiniteGrid("#infinite", {
          useRecycle: true,
          isOverflowScroll
        });
        this.inst.setLoadingBar({
          "prepend": `<div class="prepend" style="height: 100px;">PREPEND</div>`,
          "append": `<div class="append" style="height: 75px;">APPEND</div>`,
        });
        this.inst.setLayout(GridLayout);
      });
      afterEach(() => {
        if (this.inst) {
          this.inst.destroy();
          this.inst = null;
        }
        cleanup();
      });
      
      [APPEND, PREPEND].forEach(isAppend => {
        const ITEMCOUNT = 30;
        const RETRY = 1;
        it(`should trigger loadingStrat and loadingEnd event when ${isAppend ? "appending" : "prepending"} (isOverflowScroll: ${isOverflowScroll})`, done => {
          console.log("----");
          // Given
          // When
          const loadingStartHandler = sinon.spy(e => {
            const edge = this.inst.getEndOffset() || 0;
            expect(e.isTrusted).to.a.false;
            expect(e.isAppend).to.be.equal(isAppend);
            expect(innerHeight(e.loadingBar)).to.be.equal(isAppend ? 75 : 100);
            expect(parseInt(e.loadingBar.style.top || 0, 10)).to.be.equal(isAppend ? edge : 0);
          });
          const loadingEndHandler = sinon.spy(e => {
            expect(e.isTrusted).to.a.false;
            expect(e.isAppend).to.be.equal(isAppend);
          });

          this.inst.on("loadingStart", loadingStartHandler);
          this.inst.on("loadingEnd", loadingEndHandler);

          const handler = insert(this.inst, isAppend, () => {
            expect(loadingStartHandler.callCount).to.be.equal(2);
            expect(loadingEndHandler.callCount).to.be.equal(2);
            done();
          }, ITEMCOUNT, 2);
        });
      });
    });
  });  
  describe("append/prepend Test on layoutComplete", function() {
    [true, false].forEach(isOverflowScroll => {
      beforeEach(() => {
        this.el = sandbox();
        this.el.innerHTML = "<div id='infinite'></div>";
        this.inst = new InfiniteGrid("#infinite", {
          useRecycle: true,
          isOverflowScroll,
        });
        this.inst.setLayout(GridLayout);
      });
      afterEach(() => {
        if (this.inst) {
          this.inst.destroy();
          this.inst = null;
        }
        cleanup();
      });
      
      [APPEND, PREPEND].forEach(isAppend => {
        const ITEMCOUNT = 30;
        const RETRY = 7;
  
        it(`should check a ${isAppend ? "append" : "prepend"} with recycle method (isOverflowScroll: ${isOverflowScroll})`, done => {
          // Given
          // When
          const handler = insert(this.inst, isAppend, () => {
            // Then
            expect(this.inst._status.startCursor).to.be.equal(0);
            expect(this.inst._status.endCursor).to.be.equal(RETRY - 1);
            expect(this.inst.getGroupKeys()).to.have.lengthOf(RETRY);
    
            // Given
            const centerEndValue = this.inst._items
              .getEdgeValue(isAppend ? "end" : "start", this.inst._status.startCursor, 3);
    
            // When
            this.inst._watcher.scrollTo(centerEndValue);
            setTimeout(() => {
              this.inst._recycle(isAppend);
              // Then
              expect(this.inst.getGroupKeys()).to.have.lengthOf.below(RETRY);
              done();
            }, 100);
          }, ITEMCOUNT, RETRY);
        });
      });
    });
  });  
  describe("setLayout method Test", function() {
    beforeEach(() => {
      this.el = sandbox();
      this.el.innerHTML = "<div id='infinite'></div>";
      this.inst = new InfiniteGrid("#infinite");
    });
    afterEach(() => {
      if (this.inst) {
        this.inst.destroy();
        this.inst = null;
      }
      cleanup();
    });
    [true, false].forEach(horizontal => {
      it(`should set '${horizontal}' horizontal of options`, () => {
        // Given
        this.inst.options.horizontal = horizontal;
        this.inst._isVertical = !horizontal;
        
        // When
        [
          GridLayout,
          FrameLayout,
          SquareLayout,
          PackingLayout,
          JustifiedLayout
        ].forEach(v => {
          // Then
          this.inst.setLayout(v);
          if (this.inst.options.horizontal) {
            expect(this.inst._layout.options.horizontal).to.be.equal(true);
          } else {
            expect(this.inst._layout.options.horizontal).to.be.equal(false);
          }
          
          expect(this.inst._layout instanceof v).to.be.true;
        });
      });
    });
  });
  describe("data type Test", function() {
    const makeData = function(isHTMLElement) {
      const complicatedHTML = "<div class='item'><div class='thumbnail'><img class='img-rounded' src='#' /><div class='caption'><p><a href='http://www.naver.com'></a></p></div></div></div>";
      const data = [];
      
      for (let i = 0; i < 100; i++) {
        if (isHTMLElement) {
          const dummy = document.createElement("div");

          dummy.innerHTML = complicatedHTML;
          data.push(dummy.firstChild);
        } else {
          data.push(complicatedHTML);
        }
      }
      return data;
    }

    beforeEach(() => {
      this.el = sandbox();
      this.el.innerHTML = "<div id='infinite'></div>";
      window.jQuery = $;
      this.inst = new InfiniteGrid("#infinite");
      this.inst.setLayout(GridLayout);      
    });
    afterEach(() => {
      if (this.inst) {
        this.inst.destroy();
        this.inst = null;
      }
      cleanup();
    });

    const testcase = {
      "stringType": function() {
        return makeData().join("");
      },
      "arrryStringType": function() {
        return makeData();
      },
      "arrryHTMLElementType": function() {
        return makeData(true);
      },
      "jQueryType": function() {
        return $(makeData());
      }
    };
    Object.keys(testcase).forEach(v => {
      it(`should check type - '${v}'`, done => {
        // Given
        
        const layoutCompleteHandler = sinon.spy(function(e) {
          // Then
          expect(e.target).to.have.lengthOf(100);
          expect(this.getItems(true)).to.have.lengthOf(100);
          expect(this.isProcessing()).to.be.false;
          done();
        });
        
        // When
        this.inst.on("layoutComplete", layoutCompleteHandler);
        this.inst.append(testcase[v]());
      });
    });
  });
});
