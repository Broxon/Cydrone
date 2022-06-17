
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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

    const file$5 = "src/components/Navbar.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(img, file$5, 11, 8, 255);
    			attr_dev(a0, "href", "#Úvod");
    			attr_dev(a0, "class", "navbar-item svelte-c61nn5");
    			add_location(a0, file$5, 10, 6, 210);
    			attr_dev(a1, "href", "#Úvod");
    			attr_dev(a1, "class", "navbar-item is-size-5 has-text-black svelte-c61nn5");
    			add_location(a1, file$5, 13, 6, 341);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$5, 15, 8, 512);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$5, 16, 8, 548);
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$5, 17, 8, 584);
    			attr_dev(a2, "class", "navbar-burger svelte-c61nn5");
    			attr_dev(a2, "href", "#/");
    			toggle_class(a2, "is-active", /*mobile*/ ctx[0]);
    			add_location(a2, file$5, 14, 6, 422);
    			attr_dev(div0, "class", "navbar-brand");
    			add_location(div0, file$5, 9, 4, 177);
    			attr_dev(a3, "class", "navbar-item has-text-black svelte-c61nn5");
    			attr_dev(a3, "href", "#O_nás");
    			add_location(a3, file$5, 23, 10, 765);
    			attr_dev(a4, "class", "navbar-item has-text-black svelte-c61nn5");
    			attr_dev(a4, "href", "#Partneři");
    			add_location(a4, file$5, 24, 10, 839);
    			attr_dev(a5, "class", "navbar-item has-text-black svelte-c61nn5");
    			attr_dev(a5, "href", "#Naše_řešení");
    			add_location(a5, file$5, 25, 10, 919);
    			attr_dev(a6, "class", "navbar-item has-text-black svelte-c61nn5");
    			attr_dev(a6, "href", "#Kontakt");
    			add_location(a6, file$5, 26, 10, 1005);
    			attr_dev(div1, "class", "navbar-start");
    			add_location(div1, file$5, 22, 8, 728);
    			attr_dev(div2, "class", "navbar-end");
    			add_location(div2, file$5, 21, 6, 695);
    			attr_dev(div3, "class", "navbar-menu");
    			toggle_class(div3, "is-active", /*mobile*/ ctx[0]);
    			add_location(div3, file$5, 20, 4, 638);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$5, 8, 2, 149);
    			attr_dev(nav, "class", "navbar is-spaced is-transparent");
    			attr_dev(nav, "id", "Navbar");
    			add_location(nav, file$5, 7, 0, 89);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Hero.svelte generated by Svelte v3.48.0 */

    const file$4 = "src/components/Hero.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let div5;
    	let div4;
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t3;
    	let a;
    	let button;
    	let t5;
    	let div3;
    	let figure;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*typedChars*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "CyDrone disponuje širokou paletou nástrojů od rušiček rádiové komunikace až k nočnímu vidění";
    			t3 = space();
    			a = element("a");
    			button = element("button");
    			button.textContent = "ZJISTIT VÍCE";
    			t5 = space();
    			div3 = element("div");
    			figure = element("figure");
    			img0 = element("img");
    			t6 = space();
    			img1 = element("img");
    			attr_dev(div0, "class", "title is-1 has-text-white-bis is-size-2-mobile");
    			add_location(div0, file$4, 24, 8, 559);
    			attr_dev(div1, "class", "title is-5 has-text-white-bis mt-6 is-size-6-mobile");
    			add_location(div1, file$4, 27, 8, 666);
    			attr_dev(button, "class", "button is-active is-hovered is-medium is-rounded is-responsive is-fullwidth mt-6 svelte-1g3ck6n");
    			attr_dev(button, "href", "#Our_solution");
    			add_location(button, file$4, 29, 10, 873);
    			attr_dev(a, "href", "#Our_solution");
    			add_location(a, file$4, 28, 8, 838);
    			attr_dev(div2, "class", "column is-one-third svelte-1g3ck6n");
    			add_location(div2, file$4, 23, 6, 517);
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/img/gallery/dronik.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Drone");
    			add_location(img0, file$4, 34, 10, 1124);
    			attr_dev(figure, "class", "image");
    			add_location(figure, file$4, 33, 8, 1091);
    			attr_dev(div3, "class", "column svelte-1g3ck6n");
    			attr_dev(div3, "id", "image_drone");
    			add_location(div3, file$4, 32, 6, 1045);
    			attr_dev(div4, "class", "columns pb-5 is-multiline");
    			add_location(div4, file$4, 22, 4, 471);
    			attr_dev(div5, "class", "container max-width");
    			add_location(div5, file$4, 21, 2, 433);
    			attr_dev(section, "class", "section pb-0 svelte-1g3ck6n");
    			attr_dev(section, "id", "Úvod");
    			add_location(section, file$4, 20, 0, 390);
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/img/background/wave.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "vlna");
    			add_location(img1, file$4, 40, 0, 1244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			append_dev(div2, a);
    			append_dev(a, button);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, figure);
    			append_dev(figure, img0);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, img1, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*typedChars*/ 1) set_data_dev(t0, /*typedChars*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(img1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hero', slots, []);
    	let cydrone = "Kybernetický dron pro vzdálené hackování";
    	let typedChars = "";
    	let index = 0;
    	let typewriter;

    	const typeChar = () => {
    		if (index < cydrone.length) {
    			$$invalidate(0, typedChars += cydrone[index]);
    			index += 1;
    		} else {
    			clearInterval(typewriter);
    		}
    	};

    	const typing = () => typewriter = setInterval(typeChar, 50);
    	typing();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		cydrone,
    		typedChars,
    		index,
    		typewriter,
    		typeChar,
    		typing
    	});

    	$$self.$inject_state = $$props => {
    		if ('cydrone' in $$props) cydrone = $$props.cydrone;
    		if ('typedChars' in $$props) $$invalidate(0, typedChars = $$props.typedChars);
    		if ('index' in $$props) index = $$props.index;
    		if ('typewriter' in $$props) typewriter = $$props.typewriter;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [typedChars];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.48.0 */

    const file$3 = "src/components/Footer.svelte";

    function create_fragment$4(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let footer;
    	let div7;
    	let div5;
    	let div0;
    	let t1;
    	let div1;
    	let strong0;
    	let t3;
    	let ul0;
    	let li0;
    	let a0;
    	let t5;
    	let li1;
    	let a1;
    	let t7;
    	let li2;
    	let a2;
    	let t9;
    	let div2;
    	let t10;
    	let div3;
    	let strong1;
    	let t12;
    	let ul1;
    	let li3;
    	let a3;
    	let t14;
    	let li4;
    	let a4;
    	let t16;
    	let li5;
    	let a5;
    	let t17;
    	let br;
    	let t18;
    	let t19;
    	let div4;
    	let t20;
    	let div6;
    	let p;
    	let strong2;
    	let t22;
    	let a6;
    	let t24;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			footer = element("footer");
    			div7 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "CyDrone";
    			t3 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "O nás";
    			t5 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Partneři";
    			t7 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Naše řešení";
    			t9 = space();
    			div2 = element("div");
    			t10 = space();
    			div3 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "Kontakt";
    			t12 = space();
    			ul1 = element("ul");
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "+420 773 688 074";
    			t14 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "info@cydrone.cz";
    			t16 = space();
    			li5 = element("li");
    			a5 = element("a");
    			t17 = text("Preslova 72/25 Praha 5, ");
    			br = element("br");
    			t18 = text(" Smíchov 150 21");
    			t19 = space();
    			div4 = element("div");
    			t20 = space();
    			div6 = element("div");
    			p = element("p");
    			strong2 = element("strong");
    			strong2.textContent = "CyDrone";
    			t22 = text(" vytvořil\n        ");
    			a6 = element("a");
    			a6.textContent = "Bruno Bartůněk";
    			t24 = text(". Všechna práva vyhrazena. © 2022");
    			if (!src_url_equal(img.src, img_src_value = "./assets/img/background/wave_footer.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "vlna");
    			add_location(img, file$3, 0, 0, 0);
    			attr_dev(div0, "class", "column");
    			add_location(div0, file$3, 5, 6, 164);
    			attr_dev(strong0, "class", "has-text-white svelte-c73ofl");
    			add_location(strong0, file$3, 7, 8, 222);
    			attr_dev(a0, "href", "#About");
    			add_location(a0, file$3, 9, 14, 314);
    			attr_dev(li0, "class", "svelte-c73ofl");
    			add_location(li0, file$3, 9, 10, 310);
    			attr_dev(a1, "href", "#Partners");
    			add_location(a1, file$3, 10, 14, 360);
    			attr_dev(li1, "class", "svelte-c73ofl");
    			add_location(li1, file$3, 10, 10, 356);
    			attr_dev(a2, "href", "#Our_solution");
    			add_location(a2, file$3, 11, 14, 412);
    			attr_dev(li2, "class", "svelte-c73ofl");
    			add_location(li2, file$3, 11, 10, 408);
    			attr_dev(ul0, "id", "footer-ul-1");
    			attr_dev(ul0, "class", "svelte-c73ofl");
    			add_location(ul0, file$3, 8, 8, 278);
    			attr_dev(div1, "class", "column");
    			add_location(div1, file$3, 6, 6, 193);
    			attr_dev(div2, "class", "column");
    			add_location(div2, file$3, 14, 6, 490);
    			attr_dev(strong1, "class", "has-text-white svelte-c73ofl");
    			add_location(strong1, file$3, 16, 8, 548);
    			attr_dev(a3, "href", "tel:+420 773 688 074");
    			add_location(a3, file$3, 19, 12, 653);
    			attr_dev(li3, "class", "svelte-c73ofl");
    			add_location(li3, file$3, 18, 10, 636);
    			attr_dev(a4, "href", "mailto:info@cydrone.cz");
    			add_location(a4, file$3, 22, 12, 748);
    			attr_dev(li4, "class", "svelte-c73ofl");
    			add_location(li4, file$3, 21, 10, 731);
    			add_location(br, file$3, 25, 102, 934);
    			attr_dev(a5, "href", "http://maps.google.com/?q= Preslova 72, Praha 5-Smíchov");
    			add_location(a5, file$3, 25, 12, 844);
    			attr_dev(li5, "class", "svelte-c73ofl");
    			add_location(li5, file$3, 24, 10, 827);
    			attr_dev(ul1, "id", "footer-ul-2");
    			attr_dev(ul1, "class", "svelte-c73ofl");
    			add_location(ul1, file$3, 17, 8, 604);
    			attr_dev(div3, "class", "column");
    			add_location(div3, file$3, 15, 6, 519);
    			attr_dev(div4, "class", "column");
    			add_location(div4, file$3, 29, 6, 1009);
    			attr_dev(div5, "class", "columns");
    			add_location(div5, file$3, 4, 4, 136);
    			attr_dev(strong2, "class", "has-text-white svelte-c73ofl");
    			add_location(strong2, file$3, 33, 8, 1118);
    			attr_dev(a6, "href", "https://github.com/Broxon");
    			add_location(a6, file$3, 34, 8, 1183);
    			attr_dev(p, "class", "pt-6");
    			add_location(p, file$3, 32, 6, 1093);
    			attr_dev(div6, "class", "content has-text-centered");
    			add_location(div6, file$3, 31, 4, 1047);
    			attr_dev(div7, "class", "content");
    			add_location(div7, file$3, 3, 2, 110);
    			attr_dev(footer, "class", "footer pt-0 svelte-c73ofl");
    			attr_dev(footer, "id", "Kontakt");
    			add_location(footer, file$3, 2, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div7);
    			append_dev(div7, div5);
    			append_dev(div5, div0);
    			append_dev(div5, t1);
    			append_dev(div5, div1);
    			append_dev(div1, strong0);
    			append_dev(div1, t3);
    			append_dev(div1, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(ul0, t5);
    			append_dev(ul0, li1);
    			append_dev(li1, a1);
    			append_dev(ul0, t7);
    			append_dev(ul0, li2);
    			append_dev(li2, a2);
    			append_dev(div5, t9);
    			append_dev(div5, div2);
    			append_dev(div5, t10);
    			append_dev(div5, div3);
    			append_dev(div3, strong1);
    			append_dev(div3, t12);
    			append_dev(div3, ul1);
    			append_dev(ul1, li3);
    			append_dev(li3, a3);
    			append_dev(ul1, t14);
    			append_dev(ul1, li4);
    			append_dev(li4, a4);
    			append_dev(ul1, t16);
    			append_dev(ul1, li5);
    			append_dev(li5, a5);
    			append_dev(a5, t17);
    			append_dev(a5, br);
    			append_dev(a5, t18);
    			append_dev(div5, t19);
    			append_dev(div5, div4);
    			append_dev(div7, t20);
    			append_dev(div7, div6);
    			append_dev(div6, p);
    			append_dev(p, strong2);
    			append_dev(p, t22);
    			append_dev(p, a6);
    			append_dev(p, t24);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/About.svelte generated by Svelte v3.48.0 */

    const file$2 = "src/components/About.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let div17;
    	let div0;
    	let h2;
    	let t1;
    	let h5;
    	let t3;
    	let div16;
    	let div9;
    	let div4;
    	let div3;
    	let div1;
    	let figure0;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let div2;
    	let blockquote0;
    	let t6;
    	let h60;
    	let t8;
    	let h61;
    	let t10;
    	let div8;
    	let div7;
    	let div5;
    	let figure1;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let div6;
    	let blockquote1;
    	let t13;
    	let h62;
    	let t15;
    	let h63;
    	let t17;
    	let div15;
    	let div13;
    	let div12;
    	let div10;
    	let figure2;
    	let img2;
    	let img2_src_value;
    	let t18;
    	let div11;
    	let blockquote2;
    	let t20;
    	let h64;
    	let t22;
    	let h65;
    	let t24;
    	let div14;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div17 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "O nás";
    			t1 = space();
    			h5 = element("h5");
    			h5.textContent = "Představení našeho týmu, který je zodpovědný za vývoj CyDrone";
    			t3 = space();
    			div16 = element("div");
    			div9 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			figure0 = element("figure");
    			img0 = element("img");
    			t4 = space();
    			div2 = element("div");
    			blockquote0 = element("blockquote");
    			blockquote0.textContent = "\"Myslím si, že potenciál našeho projektu je obrovský\"";
    			t6 = space();
    			h60 = element("h6");
    			h60.textContent = "Alexandr Waage";
    			t8 = space();
    			h61 = element("h6");
    			h61.textContent = "IoT & security engineer";
    			t10 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			figure1 = element("figure");
    			img1 = element("img");
    			t11 = space();
    			div6 = element("div");
    			blockquote1 = element("blockquote");
    			blockquote1.textContent = "\"Díky tomuto projektu se můžu rozvíjet ve věcech, které mě baví\"";
    			t13 = space();
    			h62 = element("h6");
    			h62.textContent = "Bruno Bartůněk";
    			t15 = space();
    			h63 = element("h6");
    			h63.textContent = "Security & HW engineer";
    			t17 = space();
    			div15 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div10 = element("div");
    			figure2 = element("figure");
    			img2 = element("img");
    			t18 = space();
    			div11 = element("div");
    			blockquote2 = element("blockquote");
    			blockquote2.textContent = "\"Naše řešení je naprosto unikátní oproti ostatním\"";
    			t20 = space();
    			h64 = element("h6");
    			h64.textContent = "Akrami Amir";
    			t22 = space();
    			h65 = element("h6");
    			h65.textContent = "HW engineer & IoT engineer";
    			t24 = space();
    			div14 = element("div");
    			attr_dev(h2, "class", "title is-2");
    			add_location(h2, file$2, 3, 6, 131);
    			attr_dev(h5, "class", "subtitle is-5 has-text-grey");
    			add_location(h5, file$2, 4, 6, 171);
    			attr_dev(div0, "class", "has-text-centered pb-6");
    			add_location(div0, file$2, 2, 4, 88);
    			attr_dev(img0, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/img/people/alex.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Alexandr Waage");
    			add_location(img0, file$2, 12, 16, 520);
    			attr_dev(figure0, "class", "image is-128x128");
    			add_location(figure0, file$2, 11, 14, 470);
    			attr_dev(div1, "class", "column is-3 mt-1 mr-1 ml-1 svelte-392vwz");
    			add_location(div1, file$2, 10, 12, 415);
    			attr_dev(blockquote0, "class", "title is-4");
    			add_location(blockquote0, file$2, 16, 14, 713);
    			attr_dev(h60, "class", "title is-6 mb-0");
    			add_location(h60, file$2, 17, 14, 825);
    			attr_dev(h61, "class", "is-6 mt-0");
    			add_location(h61, file$2, 18, 14, 887);
    			attr_dev(div2, "class", "column m-1 mr-0 svelte-392vwz");
    			add_location(div2, file$2, 15, 12, 669);
    			attr_dev(div3, "class", "columns");
    			add_location(div3, file$2, 9, 10, 381);
    			attr_dev(div4, "class", "column svelte-392vwz");
    			add_location(div4, file$2, 8, 8, 350);
    			attr_dev(img1, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/img/people/bruno.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Bruno Bartůněk");
    			add_location(img1, file$2, 26, 16, 1167);
    			attr_dev(figure1, "class", "image is-128x128");
    			add_location(figure1, file$2, 25, 14, 1117);
    			attr_dev(div5, "class", "column is-3 mt-1 mr-1 ml-1 svelte-392vwz");
    			add_location(div5, file$2, 24, 12, 1062);
    			attr_dev(blockquote1, "class", "title is-4");
    			add_location(blockquote1, file$2, 30, 14, 1361);
    			attr_dev(h62, "class", "title is-6 mb-0");
    			add_location(h62, file$2, 31, 14, 1484);
    			attr_dev(h63, "class", "is-6 mt-0");
    			add_location(h63, file$2, 32, 14, 1546);
    			attr_dev(div6, "class", "column m-1 mr-0 svelte-392vwz");
    			add_location(div6, file$2, 29, 12, 1317);
    			attr_dev(div7, "class", "columns");
    			add_location(div7, file$2, 23, 10, 1028);
    			attr_dev(div8, "class", "column svelte-392vwz");
    			add_location(div8, file$2, 22, 8, 997);
    			attr_dev(div9, "class", "columns");
    			add_location(div9, file$2, 7, 6, 320);
    			attr_dev(img2, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img2.src, img2_src_value = "./assets/img/people/amir.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Akrami Amir");
    			add_location(img2, file$2, 42, 16, 1866);
    			attr_dev(figure2, "class", "image is-128x128");
    			add_location(figure2, file$2, 41, 14, 1816);
    			attr_dev(div10, "class", "column is-3 mt-1 mr-1 ml-1 svelte-392vwz");
    			add_location(div10, file$2, 40, 12, 1761);
    			attr_dev(blockquote2, "class", "title is-4");
    			add_location(blockquote2, file$2, 46, 14, 2056);
    			attr_dev(h64, "class", "title is-6 mb-0");
    			add_location(h64, file$2, 47, 14, 2165);
    			attr_dev(h65, "class", "is-6 mt-0");
    			add_location(h65, file$2, 48, 14, 2224);
    			attr_dev(div11, "class", "column m-1 mr-0 svelte-392vwz");
    			add_location(div11, file$2, 45, 12, 2012);
    			attr_dev(div12, "class", "columns");
    			add_location(div12, file$2, 39, 10, 1727);
    			attr_dev(div13, "class", "column svelte-392vwz");
    			add_location(div13, file$2, 38, 8, 1696);
    			attr_dev(div14, "class", "column svelte-392vwz");
    			add_location(div14, file$2, 52, 8, 2337);
    			attr_dev(div15, "class", "columns");
    			add_location(div15, file$2, 37, 6, 1666);
    			attr_dev(div16, "id", "div-about");
    			attr_dev(div16, "class", "svelte-392vwz");
    			add_location(div16, file$2, 6, 4, 293);
    			attr_dev(div17, "class", "container");
    			attr_dev(div17, "id", "Kontejner_o_nás");
    			add_location(div17, file$2, 1, 2, 39);
    			attr_dev(section, "class", "section");
    			attr_dev(section, "id", "O_nás");
    			add_location(section, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div17);
    			append_dev(div17, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, h5);
    			append_dev(div17, t3);
    			append_dev(div17, div16);
    			append_dev(div16, div9);
    			append_dev(div9, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, figure0);
    			append_dev(figure0, img0);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, blockquote0);
    			append_dev(div2, t6);
    			append_dev(div2, h60);
    			append_dev(div2, t8);
    			append_dev(div2, h61);
    			append_dev(div9, t10);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, figure1);
    			append_dev(figure1, img1);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			append_dev(div6, blockquote1);
    			append_dev(div6, t13);
    			append_dev(div6, h62);
    			append_dev(div6, t15);
    			append_dev(div6, h63);
    			append_dev(div16, t17);
    			append_dev(div16, div15);
    			append_dev(div15, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, figure2);
    			append_dev(figure2, img2);
    			append_dev(div12, t18);
    			append_dev(div12, div11);
    			append_dev(div11, blockquote2);
    			append_dev(div11, t20);
    			append_dev(div11, h64);
    			append_dev(div11, t22);
    			append_dev(div11, h65);
    			append_dev(div15, t24);
    			append_dev(div15, div14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Partners.svelte generated by Svelte v3.48.0 */

    const file$1 = "src/components/Partners.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let div16;
    	let div0;
    	let h2;
    	let t1;
    	let h5;
    	let t3;
    	let div15;
    	let div7;
    	let div1;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let div6;
    	let div5;
    	let article0;
    	let div2;
    	let figure0;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div4;
    	let div3;
    	let p0;
    	let strong0;
    	let t7;
    	let small0;
    	let a1;
    	let t9;
    	let br0;
    	let t10;
    	let t11;
    	let div14;
    	let div8;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t12;
    	let div13;
    	let div12;
    	let article1;
    	let div9;
    	let figure1;
    	let img3;
    	let img3_src_value;
    	let t13;
    	let div11;
    	let div10;
    	let p1;
    	let strong1;
    	let t15;
    	let small1;
    	let a3;
    	let t17;
    	let br1;
    	let t18;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div16 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Partneři";
    			t1 = space();
    			h5 = element("h5");
    			h5.textContent = "Toto jsou naši partneři, bez kterých by tento projekt nemohl vzniknout";
    			t3 = space();
    			div15 = element("div");
    			div7 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t4 = space();
    			div6 = element("div");
    			div5 = element("div");
    			article0 = element("article");
    			div2 = element("div");
    			figure0 = element("figure");
    			img1 = element("img");
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Radko Sáblík";
    			t7 = space();
    			small0 = element("small");
    			a1 = element("a");
    			a1.textContent = "@RadkoSablik";
    			t9 = space();
    			br0 = element("br");
    			t10 = text("\n                    Myslím si, že projekt CyDrone vedený pod panem Waagem je ukázkou toho, jak může fungovat podpora středních škol mezi nadanými studenty.");
    			t11 = space();
    			div14 = element("div");
    			div8 = element("div");
    			a2 = element("a");
    			img2 = element("img");
    			t12 = space();
    			div13 = element("div");
    			div12 = element("div");
    			article1 = element("article");
    			div9 = element("div");
    			figure1 = element("figure");
    			img3 = element("img");
    			t13 = space();
    			div11 = element("div");
    			div10 = element("div");
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Nathan Něměc";
    			t15 = space();
    			small1 = element("small");
    			a3 = element("a");
    			a3.textContent = "@NathanNemec";
    			t17 = space();
    			br1 = element("br");
    			t18 = text("\n                    Tento projekt mě nadchl už od počátku jeho vzniku, doufám, že budeme nadále ve velice úzké spolupráci se všemi členy CyDrone.");
    			attr_dev(h2, "class", "title is-2");
    			add_location(h2, file$1, 3, 6, 113);
    			attr_dev(h5, "class", "subtitle is-5 has-text-grey");
    			add_location(h5, file$1, 4, 6, 156);
    			attr_dev(div0, "class", "has-text-centered pb-6");
    			add_location(div0, file$1, 2, 4, 70);
    			if (!src_url_equal(img0.src, img0_src_value = "/assets/img/partners/ssps_logo.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo_ssps");
    			add_location(img0, file$1, 10, 12, 446);
    			attr_dev(a0, "href", "https://ssps.cz");
    			attr_dev(a0, "alt", "#");
    			add_location(a0, file$1, 9, 10, 399);
    			attr_dev(div1, "class", "column is-3 svelte-vxjtj1");
    			add_location(div1, file$1, 8, 8, 363);
    			if (!src_url_equal(img1.src, img1_src_value = "/assets/img/people/sablik.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Radko Sáblík");
    			add_location(img1, file$1, 18, 18, 739);
    			attr_dev(figure0, "class", "image is-64x64");
    			add_location(figure0, file$1, 17, 16, 689);
    			attr_dev(div2, "class", "media-left");
    			add_location(div2, file$1, 16, 14, 648);
    			add_location(strong0, file$1, 24, 20, 971);
    			attr_dev(a1, "href", "https://twitter.com/RadkoSablik");
    			add_location(a1, file$1, 25, 28, 1029);
    			add_location(small0, file$1, 25, 20, 1021);
    			add_location(br0, file$1, 26, 20, 1118);
    			add_location(p0, file$1, 23, 18, 947);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$1, 22, 16, 907);
    			attr_dev(div4, "class", "media-content");
    			add_location(div4, file$1, 21, 14, 863);
    			attr_dev(article0, "class", "media");
    			add_location(article0, file$1, 15, 12, 610);
    			attr_dev(div5, "class", "box");
    			add_location(div5, file$1, 14, 10, 580);
    			attr_dev(div6, "class", "column svelte-vxjtj1");
    			add_location(div6, file$1, 13, 8, 549);
    			attr_dev(div7, "class", "columns");
    			add_location(div7, file$1, 7, 6, 333);
    			if (!src_url_equal(img2.src, img2_src_value = "/assets/img/partners/haxagon.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Logo haxagonu");
    			add_location(img2, file$1, 38, 12, 1539);
    			attr_dev(a2, "href", "https://haxagon.cz/");
    			attr_dev(a2, "alt", "#");
    			add_location(a2, file$1, 37, 10, 1488);
    			attr_dev(div8, "class", "column is-3 svelte-vxjtj1");
    			add_location(div8, file$1, 36, 8, 1452);
    			if (!src_url_equal(img3.src, img3_src_value = "/assets/img/people/nathan.jpg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Nathan Němec");
    			add_location(img3, file$1, 46, 18, 1834);
    			attr_dev(figure1, "class", "image is-64x64");
    			add_location(figure1, file$1, 45, 16, 1784);
    			attr_dev(div9, "class", "media-left");
    			add_location(div9, file$1, 44, 14, 1743);
    			add_location(strong1, file$1, 52, 20, 2066);
    			attr_dev(a3, "href", "https://twitter.com/nathannemec");
    			add_location(a3, file$1, 53, 28, 2124);
    			add_location(small1, file$1, 53, 20, 2116);
    			add_location(br1, file$1, 54, 20, 2213);
    			add_location(p1, file$1, 51, 18, 2042);
    			attr_dev(div10, "class", "content");
    			add_location(div10, file$1, 50, 16, 2002);
    			attr_dev(div11, "class", "media-content");
    			add_location(div11, file$1, 49, 14, 1958);
    			attr_dev(article1, "class", "media");
    			add_location(article1, file$1, 43, 12, 1705);
    			attr_dev(div12, "class", "box");
    			add_location(div12, file$1, 42, 10, 1675);
    			attr_dev(div13, "class", "column svelte-vxjtj1");
    			add_location(div13, file$1, 41, 8, 1644);
    			attr_dev(div14, "class", "columns");
    			add_location(div14, file$1, 35, 6, 1422);
    			attr_dev(div15, "clas", "pt-6");
    			attr_dev(div15, "id", "Partners-columns");
    			attr_dev(div15, "class", "svelte-vxjtj1");
    			add_location(div15, file$1, 6, 4, 287);
    			attr_dev(div16, "class", "container");
    			add_location(div16, file$1, 1, 2, 42);
    			attr_dev(section, "class", "section");
    			attr_dev(section, "id", "Partneři");
    			add_location(section, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div16);
    			append_dev(div16, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, h5);
    			append_dev(div16, t3);
    			append_dev(div16, div15);
    			append_dev(div15, div7);
    			append_dev(div7, div1);
    			append_dev(div1, a0);
    			append_dev(a0, img0);
    			append_dev(div7, t4);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, article0);
    			append_dev(article0, div2);
    			append_dev(div2, figure0);
    			append_dev(figure0, img1);
    			append_dev(article0, t5);
    			append_dev(article0, div4);
    			append_dev(div4, div3);
    			append_dev(div3, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, t7);
    			append_dev(p0, small0);
    			append_dev(small0, a1);
    			append_dev(p0, t9);
    			append_dev(p0, br0);
    			append_dev(p0, t10);
    			append_dev(div15, t11);
    			append_dev(div15, div14);
    			append_dev(div14, div8);
    			append_dev(div8, a2);
    			append_dev(a2, img2);
    			append_dev(div14, t12);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, article1);
    			append_dev(article1, div9);
    			append_dev(div9, figure1);
    			append_dev(figure1, img3);
    			append_dev(article1, t13);
    			append_dev(article1, div11);
    			append_dev(div11, div10);
    			append_dev(div10, p1);
    			append_dev(p1, strong1);
    			append_dev(p1, t15);
    			append_dev(p1, small1);
    			append_dev(small1, a3);
    			append_dev(p1, t17);
    			append_dev(p1, br1);
    			append_dev(p1, t18);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
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

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Partners', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Partners> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Partners extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Partners",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Our_solution.svelte generated by Svelte v3.48.0 */

    const file = "src/components/Our_solution.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let div6;
    	let div0;
    	let h2;
    	let t1;
    	let h5;
    	let t3;
    	let div5;
    	let div1;
    	let figure;
    	let img;
    	let img_src_value;
    	let t4;
    	let div4;
    	let div2;
    	let strong0;
    	let t6;
    	let div3;
    	let strong1;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div6 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Naše řešení";
    			t1 = space();
    			h5 = element("h5");
    			h5.textContent = "Naše řešení obsahuje všechny důležité technikálie k zotovení bezkonkurenčního zařízení";
    			t3 = space();
    			div5 = element("div");
    			div1 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t4 = space();
    			div4 = element("div");
    			div2 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Naše řešení tkví v tom, že si veškeré komponenty vytváříme sami. To znamená, že pokud uvidíte nějaký hardware, se kterým máme osazený náš dron, tak je naprosto unikátní. To nám dává velikou volnost jak můžeme s vývojem našho dronu pokračovat.";
    			t6 = space();
    			div3 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "Dále si zakládáme na funkcích, které by měl dron schopen zvládat. Díky tomu jsme vytvořili zařízení, které je velmi multifunkční a je schopno vykonávat mnoho úkonů, které mu jsou zadány";
    			attr_dev(h2, "class", "title is-2");
    			add_location(h2, file, 3, 6, 116);
    			attr_dev(h5, "class", "subtitle is-5 has-text-grey");
    			add_location(h5, file, 4, 6, 162);
    			attr_dev(div0, "class", "has-text-centered pb-6");
    			add_location(div0, file, 2, 4, 73);
    			if (!src_url_equal(img.src, img_src_value = "./assets/img/gallery/dronik2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Drone");
    			add_location(img, file, 9, 10, 399);
    			attr_dev(figure, "class", "image");
    			add_location(figure, file, 8, 8, 366);
    			attr_dev(div1, "class", "column svelte-1t6xcuz");
    			add_location(div1, file, 7, 6, 337);
    			add_location(strong0, file, 14, 10, 596);
    			attr_dev(div2, "class", "subtitle is-6 has-text-black");
    			add_location(div2, file, 13, 8, 543);
    			add_location(strong1, file, 17, 10, 933);
    			attr_dev(div3, "class", "subtitle is-6 has-text-black");
    			add_location(div3, file, 16, 8, 880);
    			attr_dev(div4, "class", "column svelte-1t6xcuz");
    			attr_dev(div4, "id", "Solution_text");
    			add_location(div4, file, 12, 6, 495);
    			attr_dev(div5, "class", "columns");
    			add_location(div5, file, 6, 4, 309);
    			attr_dev(div6, "class", "container");
    			add_location(div6, file, 1, 2, 45);
    			attr_dev(section, "class", "section");
    			attr_dev(section, "id", "Naše_řešení");
    			add_location(section, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div6);
    			append_dev(div6, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, h5);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, figure);
    			append_dev(figure, img);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, strong0);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, strong1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
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
    	validate_slots('Our_solution', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Our_solution> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Our_solution extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Our_solution",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */

    function create_fragment(ctx) {
    	let navbar;
    	let t0;
    	let hero;
    	let t1;
    	let about;
    	let t2;
    	let partners;
    	let t3;
    	let our_solution;
    	let t4;
    	let footer;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	hero = new Hero({ $$inline: true });
    	about = new About({ $$inline: true });
    	partners = new Partners({ $$inline: true });
    	our_solution = new Our_solution({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(hero.$$.fragment);
    			t1 = space();
    			create_component(about.$$.fragment);
    			t2 = space();
    			create_component(partners.$$.fragment);
    			t3 = space();
    			create_component(our_solution.$$.fragment);
    			t4 = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(hero, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(about, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(partners, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(our_solution, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(hero.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(partners.$$.fragment, local);
    			transition_in(our_solution.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(hero.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(partners.$$.fragment, local);
    			transition_out(our_solution.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(hero, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(about, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(partners, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(our_solution, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(footer, detaching);
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

    	$$self.$capture_state = () => ({
    		Navbar,
    		Hero,
    		Footer,
    		About,
    		Partners,
    		Our_solution
    	});

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
        name: "world",
      },
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
