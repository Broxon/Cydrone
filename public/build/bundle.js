
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Navbar.svelte generated by Svelte v3.48.0 */

    const file$1 = "src/components/Navbar.svelte";

    function create_fragment$2(ctx) {
    	let nav;
    	let div4;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let a1;
    	let t2;
    	let a2;
    	let span0;
    	let t3;
    	let span1;
    	let t4;
    	let span2;
    	let t5;
    	let div3;
    	let div2;
    	let div1;
    	let a3;
    	let t7;
    	let a4;
    	let t9;
    	let a5;
    	let t11;
    	let a6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div4 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			a1 = element("a");
    			a1.textContent = "CyDrone";
    			t2 = space();
    			a2 = element("a");
    			span0 = element("span");
    			t3 = space();
    			span1 = element("span");
    			t4 = space();
    			span2 = element("span");
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			a3 = element("a");
    			a3.textContent = "O nás";
    			t7 = space();
    			a4 = element("a");
    			a4.textContent = "Partneři";
    			t9 = space();
    			a5 = element("a");
    			a5.textContent = "Naše řešení";
    			t11 = space();
    			a6 = element("a");
    			a6.textContent = "Kontakt";
    			attr_dev(img, "class", "cydrone");
    			if (!src_url_equal(img.src, img_src_value = "./assets/img/logo/CyDrone.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "#/");
    			add_location(img, file$1, 11, 16, 273);
    			attr_dev(a0, "href", "#/");
    			attr_dev(a0, "class", "navbar-item svelte-dgi1rt");
    			add_location(a0, file$1, 10, 12, 223);
    			attr_dev(a1, "href", "#hero");
    			attr_dev(a1, "class", "navbar-item is-size-5 has-text-black svelte-dgi1rt");
    			add_location(a1, file$1, 13, 12, 371);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$1, 17, 16, 584);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$1, 18, 16, 633);
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$1, 19, 16, 682);
    			attr_dev(a2, "class", "navbar-burger svelte-dgi1rt");
    			attr_dev(a2, "href", "#/");
    			toggle_class(a2, "is-active", /*mobile*/ ctx[0]);
    			add_location(a2, file$1, 16, 12, 486);
    			attr_dev(div0, "class", "navbar-brand");
    			add_location(div0, file$1, 9, 8, 184);
    			attr_dev(a3, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a3, "href", "#About");
    			add_location(a3, file$1, 25, 20, 908);
    			attr_dev(a4, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a4, "href", "#Partners");
    			add_location(a4, file$1, 28, 20, 1033);
    			attr_dev(a5, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a5, "href", "#Our_solution");
    			add_location(a5, file$1, 31, 20, 1163);
    			attr_dev(a6, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a6, "href", "/");
    			add_location(a6, file$1, 34, 20, 1301);
    			attr_dev(div1, "class", "navbar-start");
    			add_location(div1, file$1, 24, 16, 861);
    			attr_dev(div2, "class", "navbar-end");
    			add_location(div2, file$1, 23, 12, 820);
    			attr_dev(div3, "class", "navbar-menu");
    			toggle_class(div3, "is-active", /*mobile*/ ctx[0]);
    			add_location(div3, file$1, 22, 8, 757);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$1, 8, 4, 152);
    			attr_dev(nav, "class", "navbar is-spaced is-transparent");
    			attr_dev(nav, "id", "Navbar");
    			add_location(nav, file$1, 7, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div4);
    			append_dev(div4, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img);
    			append_dev(div0, t0);
    			append_dev(div0, a1);
    			append_dev(div0, t2);
    			append_dev(div0, a2);
    			append_dev(a2, span0);
    			append_dev(a2, t3);
    			append_dev(a2, span1);
    			append_dev(a2, t4);
    			append_dev(a2, span2);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, a3);
    			append_dev(div1, t7);
    			append_dev(div1, a4);
    			append_dev(div1, t9);
    			append_dev(div1, a5);
    			append_dev(div1, t11);
    			append_dev(div1, a6);

    			if (!mounted) {
    				dispose = listen_dev(a2, "click", /*toggleNav*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*mobile*/ 1) {
    				toggle_class(a2, "is-active", /*mobile*/ ctx[0]);
    			}

    			if (dirty & /*mobile*/ 1) {
    				toggle_class(div3, "is-active", /*mobile*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	let mobile;

    	const toggleNav = () => {
    		$$invalidate(0, mobile = !mobile);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ mobile, toggleNav });

    	$$self.$inject_state = $$props => {
    		if ('mobile' in $$props) $$invalidate(0, mobile = $$props.mobile);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mobile, toggleNav];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Hero.svelte generated by Svelte v3.48.0 */

    const file = "src/components/Hero.svelte";

    function create_fragment$1(ctx) {
    	let section0;
    	let div5;
    	let div4;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let t5;
    	let div3;
    	let figure0;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let section1;
    	let div23;
    	let div6;
    	let h20;
    	let t9;
    	let h60;
    	let t11;
    	let div22;
    	let div15;
    	let div10;
    	let div9;
    	let div7;
    	let figure1;
    	let img2;
    	let img2_src_value;
    	let t12;
    	let div8;
    	let blockquote0;
    	let t14;
    	let h61;
    	let t16;
    	let h62;
    	let t18;
    	let div14;
    	let div13;
    	let div11;
    	let figure2;
    	let img3;
    	let img3_src_value;
    	let t19;
    	let div12;
    	let blockquote1;
    	let t21;
    	let h63;
    	let t23;
    	let h64;
    	let t25;
    	let div21;
    	let div19;
    	let div18;
    	let div16;
    	let figure3;
    	let img4;
    	let img4_src_value;
    	let t26;
    	let div17;
    	let blockquote2;
    	let t28;
    	let h65;
    	let t30;
    	let h66;
    	let t32;
    	let div20;
    	let t33;
    	let section2;
    	let div40;
    	let div24;
    	let h21;
    	let t35;
    	let h50;
    	let t37;
    	let div39;
    	let div31;
    	let div25;
    	let a0;
    	let img5;
    	let img5_src_value;
    	let t38;
    	let div30;
    	let div29;
    	let article0;
    	let div26;
    	let figure4;
    	let img6;
    	let img6_src_value;
    	let t39;
    	let div28;
    	let div27;
    	let p0;
    	let strong0;
    	let t41;
    	let small0;
    	let a1;
    	let t43;
    	let br0;
    	let t44;
    	let t45;
    	let div38;
    	let div32;
    	let a2;
    	let img7;
    	let img7_src_value;
    	let t46;
    	let div37;
    	let div36;
    	let article1;
    	let div33;
    	let figure5;
    	let img8;
    	let img8_src_value;
    	let t47;
    	let div35;
    	let div34;
    	let p1;
    	let strong1;
    	let t49;
    	let small1;
    	let a3;
    	let t51;
    	let br1;
    	let t52;
    	let t53;
    	let section3;
    	let div47;
    	let div41;
    	let h22;
    	let t55;
    	let h51;
    	let t57;
    	let div46;
    	let div42;
    	let figure6;
    	let img9;
    	let img9_src_value;
    	let t58;
    	let div45;
    	let div43;
    	let t60;
    	let div44;

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Kybernetický dron pro vzdálené hackování";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "CyDrone disponuje širokou paletou nástrojů od rušiček\n                    rádiové komunikace až k nočnímu vidění";
    			t3 = space();
    			button = element("button");
    			button.textContent = "ZJISTIT VÍCE";
    			t5 = space();
    			div3 = element("div");
    			figure0 = element("figure");
    			img0 = element("img");
    			t6 = space();
    			img1 = element("img");
    			t7 = space();
    			section1 = element("section");
    			div23 = element("div");
    			div6 = element("div");
    			h20 = element("h2");
    			h20.textContent = "O nás";
    			t9 = space();
    			h60 = element("h6");
    			h60.textContent = "Představení našeho týmu, který je zodpovědný za vývoj CyDrone";
    			t11 = space();
    			div22 = element("div");
    			div15 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div7 = element("div");
    			figure1 = element("figure");
    			img2 = element("img");
    			t12 = space();
    			div8 = element("div");
    			blockquote0 = element("blockquote");
    			blockquote0.textContent = "\"Myslím si, že potenciál našeho projektu je\n                                obrovský\"";
    			t14 = space();
    			h61 = element("h6");
    			h61.textContent = "Alexandr Waage";
    			t16 = space();
    			h62 = element("h6");
    			h62.textContent = "IoT & security engineer";
    			t18 = space();
    			div14 = element("div");
    			div13 = element("div");
    			div11 = element("div");
    			figure2 = element("figure");
    			img3 = element("img");
    			t19 = space();
    			div12 = element("div");
    			blockquote1 = element("blockquote");
    			blockquote1.textContent = "\"Díky tomuto projektu se můžu rozvíjet ve\n                                věcech, které mě baví\"";
    			t21 = space();
    			h63 = element("h6");
    			h63.textContent = "Bruno Bartůněk";
    			t23 = space();
    			h64 = element("h6");
    			h64.textContent = "Security & HW engineer";
    			t25 = space();
    			div21 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			div16 = element("div");
    			figure3 = element("figure");
    			img4 = element("img");
    			t26 = space();
    			div17 = element("div");
    			blockquote2 = element("blockquote");
    			blockquote2.textContent = "\"Naše řešení je naprosto unikátní oproti\n                                ostatním\"";
    			t28 = space();
    			h65 = element("h6");
    			h65.textContent = "Akrami Amir";
    			t30 = space();
    			h66 = element("h6");
    			h66.textContent = "HW engineer & IoT engineer";
    			t32 = space();
    			div20 = element("div");
    			t33 = space();
    			section2 = element("section");
    			div40 = element("div");
    			div24 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Partneři";
    			t35 = space();
    			h50 = element("h5");
    			h50.textContent = "Toto jsou naši partneři, bez kterých by tento projekt nemohl\n                vzniknout";
    			t37 = space();
    			div39 = element("div");
    			div31 = element("div");
    			div25 = element("div");
    			a0 = element("a");
    			img5 = element("img");
    			t38 = space();
    			div30 = element("div");
    			div29 = element("div");
    			article0 = element("article");
    			div26 = element("div");
    			figure4 = element("figure");
    			img6 = element("img");
    			t39 = space();
    			div28 = element("div");
    			div27 = element("div");
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Radko Sáblík";
    			t41 = space();
    			small0 = element("small");
    			a1 = element("a");
    			a1.textContent = "@RadkoSablik";
    			t43 = space();
    			br0 = element("br");
    			t44 = text("\n                                        Myslím si, že projekt CyDrone vedený pod\n                                        panem Waagem je ukázkou toho, jak může fungovat\n                                        podpora středních škol mezi nadanými studenty.");
    			t45 = space();
    			div38 = element("div");
    			div32 = element("div");
    			a2 = element("a");
    			img7 = element("img");
    			t46 = space();
    			div37 = element("div");
    			div36 = element("div");
    			article1 = element("article");
    			div33 = element("div");
    			figure5 = element("figure");
    			img8 = element("img");
    			t47 = space();
    			div35 = element("div");
    			div34 = element("div");
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Nathan Něměc";
    			t49 = space();
    			small1 = element("small");
    			a3 = element("a");
    			a3.textContent = "@NathanNemec";
    			t51 = space();
    			br1 = element("br");
    			t52 = text("\n                                        Tento projekt mě nadchl už od počátku jeho\n                                        vzniku, doufám, že budeme nadále ve velice\n                                        úzké spolupráci se všemi členy CyDrone.");
    			t53 = space();
    			section3 = element("section");
    			div47 = element("div");
    			div41 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Naše řešení";
    			t55 = space();
    			h51 = element("h5");
    			h51.textContent = "Naše řešení obsahuje všechny důležité technikálie k zotovení bezkonkurenčního zařízení";
    			t57 = space();
    			div46 = element("div");
    			div42 = element("div");
    			figure6 = element("figure");
    			img9 = element("img");
    			t58 = space();
    			div45 = element("div");
    			div43 = element("div");
    			div43.textContent = "Naše řešení tkví v tom, že si veškeré komponenty vytváříme sami. To znamená, že pokud uvidíte nějaký hardware, se kterým máme osazený náš dron, tak je naprosto unikátní. To nám dává velikou volnost jak můžeme s vývojem našho dronu pokračovat.";
    			t60 = space();
    			div44 = element("div");
    			div44.textContent = "Dále si zakládáme na funkcích, které by měl dron schopen zvládat. Díky tomu jsme vytvořili zařízení, které je velmi multifunkční a je schopno vykonávat mnoho úkonů, které mu jsou zadány";
    			attr_dev(div0, "class", "title is-1 has-text-white-bis is-size-2-mobile");
    			add_location(div0, file, 4, 16, 184);
    			attr_dev(div1, "class", "title is-5 has-text-white-bis mt-6 is-size-6-mobile");
    			add_location(div1, file, 7, 16, 345);
    			attr_dev(button, "class", "button is-active is-hovered is-medium is-rounded is-responsive is-fullwidth mt-6 svelte-19lqni");
    			add_location(button, file, 13, 16, 620);
    			attr_dev(div2, "class", "column is-one-third svelte-19lqni");
    			add_location(div2, file, 3, 12, 134);
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/img/gallery/Dronik.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Drone");
    			add_location(img0, file, 20, 20, 908);
    			attr_dev(figure0, "class", "image");
    			add_location(figure0, file, 19, 16, 865);
    			attr_dev(div3, "class", "column svelte-19lqni");
    			add_location(div3, file, 18, 12, 828);
    			attr_dev(div4, "class", "columns pb-5 is-multiline");
    			add_location(div4, file, 2, 8, 82);
    			attr_dev(div5, "class", "container max-width");
    			add_location(div5, file, 1, 4, 40);
    			attr_dev(section0, "class", "section svelte-19lqni");
    			attr_dev(section0, "id", "hero");
    			add_location(section0, file, 0, 0, 0);
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/img/background/wave.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "wave");
    			add_location(img1, file, 26, 0, 1048);
    			attr_dev(h20, "class", "title is-2");
    			add_location(h20, file, 31, 12, 1250);
    			attr_dev(h60, "class", "subtitle is-5 has-text-grey");
    			add_location(h60, file, 32, 12, 1296);
    			attr_dev(div6, "class", "has-text-centered pb-6");
    			add_location(div6, file, 30, 8, 1201);
    			attr_dev(img2, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img2.src, img2_src_value = "./assets/img/people/Alex.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Alexandr Waage");
    			add_location(img2, file, 42, 32, 1749);
    			attr_dev(figure1, "class", "image is-128x128");
    			add_location(figure1, file, 41, 28, 1683);
    			attr_dev(div7, "class", "column is-3 mt-1 mr-1 ml-1 svelte-19lqni");
    			add_location(div7, file, 40, 24, 1614);
    			attr_dev(blockquote0, "class", "title is-4");
    			add_location(blockquote0, file, 50, 28, 2134);
    			attr_dev(h61, "class", "title is-6 mb-0");
    			add_location(h61, file, 54, 28, 2354);
    			attr_dev(h62, "class", "is-6 mt-0");
    			add_location(h62, file, 55, 28, 2430);
    			attr_dev(div8, "class", "column m-1 mr-0 svelte-19lqni");
    			add_location(div8, file, 49, 24, 2076);
    			attr_dev(div9, "class", "columns");
    			add_location(div9, file, 39, 20, 1568);
    			attr_dev(div10, "class", "column svelte-19lqni");
    			add_location(div10, file, 38, 16, 1527);
    			attr_dev(img3, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img3.src, img3_src_value = "./assets/img/people/Bruno.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Bruno Bartůněk");
    			add_location(img3, file, 63, 32, 2800);
    			attr_dev(figure2, "class", "image is-128x128");
    			add_location(figure2, file, 62, 28, 2734);
    			attr_dev(div11, "class", "column is-3 mt-1 mr-1 ml-1 svelte-19lqni");
    			add_location(div11, file, 61, 24, 2665);
    			attr_dev(blockquote1, "class", "title is-4");
    			add_location(blockquote1, file, 71, 28, 3186);
    			attr_dev(h63, "class", "title is-6 mb-0");
    			add_location(h63, file, 75, 28, 3417);
    			attr_dev(h64, "class", "is-6 mt-0");
    			add_location(h64, file, 76, 28, 3493);
    			attr_dev(div12, "class", "column m-1 mr-0 svelte-19lqni");
    			add_location(div12, file, 70, 24, 3128);
    			attr_dev(div13, "class", "columns");
    			add_location(div13, file, 60, 20, 2619);
    			attr_dev(div14, "class", "column svelte-19lqni");
    			add_location(div14, file, 59, 16, 2578);
    			attr_dev(div15, "class", "columns");
    			add_location(div15, file, 37, 12, 1489);
    			attr_dev(img4, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img4.src, img4_src_value = "./assets/img/people/Amir.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "Akrami Amir");
    			add_location(img4, file, 86, 32, 3915);
    			attr_dev(figure3, "class", "image is-128x128");
    			add_location(figure3, file, 85, 28, 3849);
    			attr_dev(div16, "class", "column is-3 mt-1 mr-1 ml-1 svelte-19lqni");
    			add_location(div16, file, 84, 24, 3780);
    			attr_dev(blockquote2, "class", "title is-4");
    			add_location(blockquote2, file, 94, 28, 4297);
    			attr_dev(h65, "class", "title is-6 mb-0");
    			add_location(h65, file, 98, 28, 4514);
    			attr_dev(h66, "class", "is-6 mt-0");
    			add_location(h66, file, 99, 28, 4587);
    			attr_dev(div17, "class", "column m-1 mr-0 svelte-19lqni");
    			add_location(div17, file, 93, 24, 4239);
    			attr_dev(div18, "class", "columns");
    			add_location(div18, file, 83, 20, 3734);
    			attr_dev(div19, "class", "column svelte-19lqni");
    			add_location(div19, file, 82, 16, 3693);
    			attr_dev(div20, "class", "column svelte-19lqni");
    			add_location(div20, file, 105, 16, 4800);
    			attr_dev(div21, "class", "columns");
    			add_location(div21, file, 81, 12, 3655);
    			attr_dev(div22, "id", "div-about");
    			attr_dev(div22, "class", "svelte-19lqni");
    			add_location(div22, file, 36, 8, 1456);
    			attr_dev(div23, "class", "container");
    			attr_dev(div23, "id", "container-about");
    			add_location(div23, file, 29, 4, 1148);
    			attr_dev(section1, "class", "section");
    			attr_dev(section1, "id", "About");
    			add_location(section1, file, 28, 0, 1107);
    			attr_dev(h21, "class", "title is-2");
    			add_location(h21, file, 114, 12, 5005);
    			attr_dev(h50, "class", "subtitle is-5 has-text-grey");
    			add_location(h50, file, 115, 12, 5054);
    			attr_dev(div24, "class", "has-text-centered pb-6");
    			add_location(div24, file, 113, 8, 4956);
    			if (!src_url_equal(img5.src, img5_src_value = "/assets/img/partners/ssps_logo.svg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "logo_ssps");
    			add_location(img5, file, 124, 24, 5434);
    			attr_dev(a0, "href", "https://ssps.cz");
    			attr_dev(a0, "alt", "#");
    			add_location(a0, file, 123, 20, 5375);
    			attr_dev(div25, "class", "column is-3 svelte-19lqni");
    			add_location(div25, file, 122, 16, 5329);
    			if (!src_url_equal(img6.src, img6_src_value = "/assets/img/people/sablik.jpg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "Image");
    			add_location(img6, file, 136, 36, 5985);
    			attr_dev(figure4, "class", "image is-64x64");
    			add_location(figure4, file, 134, 32, 5835);
    			attr_dev(div26, "class", "media-left");
    			add_location(div26, file, 133, 28, 5778);
    			add_location(strong0, file, 145, 40, 6424);
    			attr_dev(a1, "href", "https://twitter.com/RadkoSablik");
    			add_location(a1, file, 147, 44, 6546);
    			add_location(small0, file, 146, 40, 6494);
    			add_location(br0, file, 153, 40, 6881);
    			add_location(p0, file, 144, 36, 6380);
    			attr_dev(div27, "class", "content");
    			add_location(div27, file, 143, 32, 6322);
    			attr_dev(div28, "class", "media-content");
    			add_location(div28, file, 142, 28, 6262);
    			attr_dev(article0, "class", "media");
    			add_location(article0, file, 132, 24, 5726);
    			attr_dev(div29, "class", "box");
    			add_location(div29, file, 131, 20, 5684);
    			attr_dev(div30, "class", "column svelte-19lqni");
    			add_location(div30, file, 130, 16, 5643);
    			attr_dev(div31, "class", "columns");
    			add_location(div31, file, 121, 12, 5291);
    			if (!src_url_equal(img7.src, img7_src_value = "/assets/img/partners/haxagon.svg")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "logo_ssps");
    			add_location(img7, file, 167, 24, 7522);
    			attr_dev(a2, "href", "https://haxagon.cz/");
    			attr_dev(a2, "alt", "#");
    			add_location(a2, file, 166, 20, 7459);
    			attr_dev(div32, "class", "column is-3 svelte-19lqni");
    			add_location(div32, file, 165, 16, 7413);
    			if (!src_url_equal(img8.src, img8_src_value = "/assets/img/people/nathan.jpg")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "Image");
    			add_location(img8, file, 179, 36, 8071);
    			attr_dev(figure5, "class", "image is-64x64");
    			add_location(figure5, file, 177, 32, 7921);
    			attr_dev(div33, "class", "media-left");
    			add_location(div33, file, 176, 28, 7864);
    			add_location(strong1, file, 188, 40, 8510);
    			attr_dev(a3, "href", "https://twitter.com/nathannemec");
    			add_location(a3, file, 190, 44, 8632);
    			add_location(small1, file, 189, 40, 8580);
    			add_location(br1, file, 196, 40, 8967);
    			add_location(p1, file, 187, 36, 8466);
    			attr_dev(div34, "class", "content");
    			add_location(div34, file, 186, 32, 8408);
    			attr_dev(div35, "class", "media-content");
    			add_location(div35, file, 185, 28, 8348);
    			attr_dev(article1, "class", "media");
    			add_location(article1, file, 175, 24, 7812);
    			attr_dev(div36, "class", "box");
    			add_location(div36, file, 174, 20, 7770);
    			attr_dev(div37, "class", "column svelte-19lqni");
    			add_location(div37, file, 173, 16, 7729);
    			attr_dev(div38, "class", "columns");
    			add_location(div38, file, 164, 12, 7375);
    			attr_dev(div39, "clas", "pt-6");
    			attr_dev(div39, "id", "Partners-columns");
    			attr_dev(div39, "class", "svelte-19lqni");
    			add_location(div39, file, 120, 8, 5239);
    			attr_dev(div40, "class", "container");
    			add_location(div40, file, 112, 4, 4924);
    			attr_dev(section2, "class", "section");
    			attr_dev(section2, "id", "Partners");
    			add_location(section2, file, 111, 0, 4880);
    			attr_dev(h22, "class", "title is-2");
    			add_location(h22, file, 215, 12, 9589);
    			attr_dev(h51, "class", "subtitle is-5 has-text-grey");
    			add_location(h51, file, 216, 12, 9641);
    			attr_dev(div41, "class", "has-text-centered pb-6");
    			add_location(div41, file, 214, 8, 9540);
    			if (!src_url_equal(img9.src, img9_src_value = "./assets/img/gallery/Dronik2.png")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "Drone");
    			add_location(img9, file, 223, 20, 9940);
    			attr_dev(figure6, "class", "image");
    			add_location(figure6, file, 222, 16, 9897);
    			attr_dev(div42, "class", "column svelte-19lqni");
    			add_location(div42, file, 221, 12, 9860);
    			attr_dev(div43, "class", "subtitle is-6 has-text-grey");
    			add_location(div43, file, 227, 16, 10093);
    			attr_dev(div44, "class", "subtitle is-6 has-text-grey");
    			add_location(div44, file, 230, 16, 10441);
    			attr_dev(div45, "class", "column svelte-19lqni");
    			add_location(div45, file, 226, 12, 10056);
    			attr_dev(div46, "class", "columns");
    			add_location(div46, file, 220, 8, 9826);
    			attr_dev(div47, "class", "container");
    			add_location(div47, file, 213, 4, 9508);
    			attr_dev(section3, "class", "section");
    			add_location(section3, file, 212, 0, 9478);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			append_dev(div2, button);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, figure0);
    			append_dev(figure0, img0);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, img1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, div23);
    			append_dev(div23, div6);
    			append_dev(div6, h20);
    			append_dev(div6, t9);
    			append_dev(div6, h60);
    			append_dev(div23, t11);
    			append_dev(div23, div22);
    			append_dev(div22, div15);
    			append_dev(div15, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div7, figure1);
    			append_dev(figure1, img2);
    			append_dev(div9, t12);
    			append_dev(div9, div8);
    			append_dev(div8, blockquote0);
    			append_dev(div8, t14);
    			append_dev(div8, h61);
    			append_dev(div8, t16);
    			append_dev(div8, h62);
    			append_dev(div15, t18);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div11);
    			append_dev(div11, figure2);
    			append_dev(figure2, img3);
    			append_dev(div13, t19);
    			append_dev(div13, div12);
    			append_dev(div12, blockquote1);
    			append_dev(div12, t21);
    			append_dev(div12, h63);
    			append_dev(div12, t23);
    			append_dev(div12, h64);
    			append_dev(div22, t25);
    			append_dev(div22, div21);
    			append_dev(div21, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div16);
    			append_dev(div16, figure3);
    			append_dev(figure3, img4);
    			append_dev(div18, t26);
    			append_dev(div18, div17);
    			append_dev(div17, blockquote2);
    			append_dev(div17, t28);
    			append_dev(div17, h65);
    			append_dev(div17, t30);
    			append_dev(div17, h66);
    			append_dev(div21, t32);
    			append_dev(div21, div20);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, div40);
    			append_dev(div40, div24);
    			append_dev(div24, h21);
    			append_dev(div24, t35);
    			append_dev(div24, h50);
    			append_dev(div40, t37);
    			append_dev(div40, div39);
    			append_dev(div39, div31);
    			append_dev(div31, div25);
    			append_dev(div25, a0);
    			append_dev(a0, img5);
    			append_dev(div31, t38);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, article0);
    			append_dev(article0, div26);
    			append_dev(div26, figure4);
    			append_dev(figure4, img6);
    			append_dev(article0, t39);
    			append_dev(article0, div28);
    			append_dev(div28, div27);
    			append_dev(div27, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, t41);
    			append_dev(p0, small0);
    			append_dev(small0, a1);
    			append_dev(p0, t43);
    			append_dev(p0, br0);
    			append_dev(p0, t44);
    			append_dev(div39, t45);
    			append_dev(div39, div38);
    			append_dev(div38, div32);
    			append_dev(div32, a2);
    			append_dev(a2, img7);
    			append_dev(div38, t46);
    			append_dev(div38, div37);
    			append_dev(div37, div36);
    			append_dev(div36, article1);
    			append_dev(article1, div33);
    			append_dev(div33, figure5);
    			append_dev(figure5, img8);
    			append_dev(article1, t47);
    			append_dev(article1, div35);
    			append_dev(div35, div34);
    			append_dev(div34, p1);
    			append_dev(p1, strong1);
    			append_dev(p1, t49);
    			append_dev(p1, small1);
    			append_dev(small1, a3);
    			append_dev(p1, t51);
    			append_dev(p1, br1);
    			append_dev(p1, t52);
    			insert_dev(target, t53, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, div47);
    			append_dev(div47, div41);
    			append_dev(div41, h22);
    			append_dev(div41, t55);
    			append_dev(div41, h51);
    			append_dev(div47, t57);
    			append_dev(div47, div46);
    			append_dev(div46, div42);
    			append_dev(div42, figure6);
    			append_dev(figure6, img9);
    			append_dev(div46, t58);
    			append_dev(div46, div45);
    			append_dev(div45, div43);
    			append_dev(div45, t60);
    			append_dev(div45, div44);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(img1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(section2);
    			if (detaching) detach_dev(t53);
    			if (detaching) detach_dev(section3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hero', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */

    function create_fragment(ctx) {
    	let navbar;
    	let t;
    	let hero;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	hero = new Hero({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t = space();
    			create_component(hero.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(hero, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(hero.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(hero.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(hero, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Hero });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
