
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
    			add_location(img, file$5, 11, 16, 276);
    			attr_dev(a0, "href", "#hero");
    			attr_dev(a0, "class", "navbar-item svelte-dgi1rt");
    			add_location(a0, file$5, 10, 12, 223);
    			attr_dev(a1, "href", "#hero");
    			attr_dev(a1, "class", "navbar-item is-size-5 has-text-black svelte-dgi1rt");
    			add_location(a1, file$5, 13, 12, 374);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$5, 17, 16, 587);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$5, 18, 16, 636);
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$5, 19, 16, 685);
    			attr_dev(a2, "class", "navbar-burger svelte-dgi1rt");
    			attr_dev(a2, "href", "#/");
    			toggle_class(a2, "is-active", /*mobile*/ ctx[0]);
    			add_location(a2, file$5, 16, 12, 489);
    			attr_dev(div0, "class", "navbar-brand");
    			add_location(div0, file$5, 9, 8, 184);
    			attr_dev(a3, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a3, "href", "#About");
    			add_location(a3, file$5, 25, 20, 911);
    			attr_dev(a4, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a4, "href", "#Partners");
    			add_location(a4, file$5, 28, 20, 1036);
    			attr_dev(a5, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a5, "href", "#Our_solution");
    			add_location(a5, file$5, 31, 20, 1166);
    			attr_dev(a6, "class", "navbar-item has-text-black svelte-dgi1rt");
    			attr_dev(a6, "href", "#footer");
    			add_location(a6, file$5, 34, 20, 1304);
    			attr_dev(div1, "class", "navbar-start");
    			add_location(div1, file$5, 24, 16, 864);
    			attr_dev(div2, "class", "navbar-end");
    			add_location(div2, file$5, 23, 12, 823);
    			attr_dev(div3, "class", "navbar-menu");
    			toggle_class(div3, "is-active", /*mobile*/ ctx[0]);
    			add_location(div3, file$5, 22, 8, 760);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$5, 8, 4, 152);
    			attr_dev(nav, "class", "navbar is-spaced is-transparent");
    			attr_dev(nav, "id", "Navbar");
    			add_location(nav, file$5, 7, 0, 90);
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
    			div1.textContent = "CyDrone disponuje širokou paletou nástrojů od rušiček\n                    rádiové komunikace až k nočnímu vidění";
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
    			add_location(div0, file$4, 24, 16, 534);
    			attr_dev(div1, "class", "title is-5 has-text-white-bis mt-6 is-size-6-mobile");
    			add_location(div1, file$4, 27, 16, 667);
    			attr_dev(button, "class", "button is-active is-hovered is-medium is-rounded is-responsive is-fullwidth mt-6 svelte-qngtyo");
    			attr_dev(button, "href", "#Our_solution");
    			add_location(button, file$4, 34, 20, 987);
    			attr_dev(a, "href", "#Our_solution");
    			add_location(a, file$4, 33, 16, 942);
    			attr_dev(div2, "class", "column is-one-third svelte-qngtyo");
    			add_location(div2, file$4, 23, 12, 484);
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/img/gallery/Dronik.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Drone");
    			add_location(img0, file$4, 42, 20, 1345);
    			attr_dev(figure, "class", "image");
    			add_location(figure, file$4, 41, 16, 1302);
    			attr_dev(div3, "class", "column svelte-qngtyo");
    			attr_dev(div3, "id", "image_drone");
    			add_location(div3, file$4, 40, 12, 1248);
    			attr_dev(div4, "class", "columns pb-5 is-multiline");
    			add_location(div4, file$4, 22, 8, 432);
    			attr_dev(div5, "class", "container max-width");
    			add_location(div5, file$4, 21, 4, 390);
    			attr_dev(section, "class", "section svelte-qngtyo");
    			attr_dev(section, "id", "hero");
    			add_location(section, file$4, 20, 0, 350);
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/img/background/wave.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "wave");
    			add_location(img1, file$4, 48, 0, 1485);
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
    			t22 = text(" vytvořil\n                ");
    			a6 = element("a");
    			a6.textContent = "Bruno Bartůněk";
    			t24 = text(".\n                Všechna práva vyhrazena. © 2022");
    			if (!src_url_equal(img.src, img_src_value = "./assets/img/background/wave_footer.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "wave");
    			add_location(img, file$3, 0, 0, 0);
    			attr_dev(div0, "class", "column");
    			add_location(div0, file$3, 5, 12, 175);
    			attr_dev(strong0, "class", "has-text-white svelte-7y77pk");
    			add_location(strong0, file$3, 7, 16, 247);
    			attr_dev(a0, "href", "#About");
    			add_location(a0, file$3, 9, 24, 357);
    			attr_dev(li0, "class", "svelte-7y77pk");
    			add_location(li0, file$3, 9, 20, 353);
    			attr_dev(a1, "href", "#Partners");
    			add_location(a1, file$3, 10, 24, 413);
    			attr_dev(li1, "class", "svelte-7y77pk");
    			add_location(li1, file$3, 10, 20, 409);
    			attr_dev(a2, "href", "#Our_solution");
    			add_location(a2, file$3, 11, 24, 475);
    			attr_dev(li2, "class", "svelte-7y77pk");
    			add_location(li2, file$3, 11, 20, 471);
    			attr_dev(ul0, "id", "footer-ul-1");
    			attr_dev(ul0, "class", "svelte-7y77pk");
    			add_location(ul0, file$3, 8, 16, 311);
    			attr_dev(div1, "class", "column");
    			add_location(div1, file$3, 6, 12, 210);
    			attr_dev(div2, "class", "column");
    			add_location(div2, file$3, 14, 12, 573);
    			attr_dev(strong1, "class", "has-text-white svelte-7y77pk");
    			add_location(strong1, file$3, 17, 16, 662);
    			attr_dev(a3, "href", "tel:+420 773 688 074");
    			add_location(a3, file$3, 20, 24, 797);
    			attr_dev(li3, "class", "svelte-7y77pk");
    			add_location(li3, file$3, 19, 20, 768);
    			attr_dev(a4, "href", "mailto:info@cydrone.cz");
    			add_location(a4, file$3, 23, 24, 924);
    			attr_dev(li4, "class", "svelte-7y77pk");
    			add_location(li4, file$3, 22, 20, 895);
    			add_location(br, file$3, 28, 53, 1199);
    			attr_dev(a5, "href", "http://maps.google.com/?q= Preslova 72, Praha 5-Smíchov");
    			add_location(a5, file$3, 26, 24, 1052);
    			attr_dev(li5, "class", "svelte-7y77pk");
    			add_location(li5, file$3, 25, 20, 1023);
    			attr_dev(ul1, "id", "footer-ul-2");
    			attr_dev(ul1, "class", "svelte-7y77pk");
    			add_location(ul1, file$3, 18, 16, 726);
    			attr_dev(div3, "class", "column");
    			add_location(div3, file$3, 16, 12, 625);
    			attr_dev(div4, "class", "column");
    			add_location(div4, file$3, 33, 12, 1329);
    			attr_dev(div5, "class", "columns");
    			add_location(div5, file$3, 4, 8, 141);
    			attr_dev(strong2, "class", "has-text-white svelte-7y77pk");
    			add_location(strong2, file$3, 37, 16, 1460);
    			attr_dev(a6, "href", "https://github.com/Broxon");
    			add_location(a6, file$3, 38, 16, 1533);
    			attr_dev(p, "class", "pt-6");
    			add_location(p, file$3, 36, 12, 1427);
    			attr_dev(div6, "class", "content has-text-centered");
    			add_location(div6, file$3, 35, 8, 1375);
    			attr_dev(div7, "class", "content");
    			add_location(div7, file$3, 3, 4, 111);
    			attr_dev(footer, "class", "footer pt-0 svelte-7y77pk");
    			attr_dev(footer, "id", "footer");
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
    	let h60;
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
    	let h61;
    	let t8;
    	let h62;
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
    	let h63;
    	let t15;
    	let h64;
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
    	let h65;
    	let t22;
    	let h66;
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
    			h60 = element("h6");
    			h60.textContent = "Představení našeho týmu, který je zodpovědný za vývoj CyDrone";
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
    			blockquote0.textContent = "\"Myslím si, že potenciál našeho projektu je\n                                obrovský\"";
    			t6 = space();
    			h61 = element("h6");
    			h61.textContent = "Alexandr Waage";
    			t8 = space();
    			h62 = element("h6");
    			h62.textContent = "IoT & security engineer";
    			t10 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			figure1 = element("figure");
    			img1 = element("img");
    			t11 = space();
    			div6 = element("div");
    			blockquote1 = element("blockquote");
    			blockquote1.textContent = "\"Díky tomuto projektu se můžu rozvíjet ve\n                                věcech, které mě baví\"";
    			t13 = space();
    			h63 = element("h6");
    			h63.textContent = "Bruno Bartůněk";
    			t15 = space();
    			h64 = element("h6");
    			h64.textContent = "Security & HW engineer";
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
    			blockquote2.textContent = "\"Naše řešení je naprosto unikátní oproti\n                                ostatním\"";
    			t20 = space();
    			h65 = element("h6");
    			h65.textContent = "Akrami Amir";
    			t22 = space();
    			h66 = element("h6");
    			h66.textContent = "HW engineer & IoT engineer";
    			t24 = space();
    			div14 = element("div");
    			attr_dev(h2, "class", "title is-2");
    			add_location(h2, file$2, 3, 12, 143);
    			attr_dev(h60, "class", "subtitle is-5 has-text-grey");
    			add_location(h60, file$2, 4, 12, 189);
    			attr_dev(div0, "class", "has-text-centered pb-6");
    			add_location(div0, file$2, 2, 8, 94);
    			attr_dev(img0, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/img/people/Alex.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Alexandr Waage");
    			add_location(img0, file$2, 14, 32, 642);
    			attr_dev(figure0, "class", "image is-128x128");
    			add_location(figure0, file$2, 13, 28, 576);
    			attr_dev(div1, "class", "column is-3 mt-1 mr-1 ml-1 svelte-fxoshz");
    			add_location(div1, file$2, 12, 24, 507);
    			attr_dev(blockquote0, "class", "title is-4");
    			add_location(blockquote0, file$2, 22, 28, 1027);
    			attr_dev(h61, "class", "title is-6 mb-0");
    			add_location(h61, file$2, 26, 28, 1247);
    			attr_dev(h62, "class", "is-6 mt-0");
    			add_location(h62, file$2, 27, 28, 1323);
    			attr_dev(div2, "class", "column m-1 mr-0 svelte-fxoshz");
    			add_location(div2, file$2, 21, 24, 969);
    			attr_dev(div3, "class", "columns");
    			add_location(div3, file$2, 11, 20, 461);
    			attr_dev(div4, "class", "column svelte-fxoshz");
    			add_location(div4, file$2, 10, 16, 420);
    			attr_dev(img1, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/img/people/Bruno.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Bruno Bartůněk");
    			add_location(img1, file$2, 35, 32, 1693);
    			attr_dev(figure1, "class", "image is-128x128");
    			add_location(figure1, file$2, 34, 28, 1627);
    			attr_dev(div5, "class", "column is-3 mt-1 mr-1 ml-1 svelte-fxoshz");
    			add_location(div5, file$2, 33, 24, 1558);
    			attr_dev(blockquote1, "class", "title is-4");
    			add_location(blockquote1, file$2, 43, 28, 2079);
    			attr_dev(h63, "class", "title is-6 mb-0");
    			add_location(h63, file$2, 47, 28, 2310);
    			attr_dev(h64, "class", "is-6 mt-0");
    			add_location(h64, file$2, 48, 28, 2386);
    			attr_dev(div6, "class", "column m-1 mr-0 svelte-fxoshz");
    			add_location(div6, file$2, 42, 24, 2021);
    			attr_dev(div7, "class", "columns");
    			add_location(div7, file$2, 32, 20, 1512);
    			attr_dev(div8, "class", "column svelte-fxoshz");
    			add_location(div8, file$2, 31, 16, 1471);
    			attr_dev(div9, "class", "columns");
    			add_location(div9, file$2, 9, 12, 382);
    			attr_dev(img2, "class", "is-rounded is-128x128");
    			if (!src_url_equal(img2.src, img2_src_value = "./assets/img/people/Amir.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Akrami Amir");
    			add_location(img2, file$2, 58, 32, 2808);
    			attr_dev(figure2, "class", "image is-128x128");
    			add_location(figure2, file$2, 57, 28, 2742);
    			attr_dev(div10, "class", "column is-3 mt-1 mr-1 ml-1 svelte-fxoshz");
    			add_location(div10, file$2, 56, 24, 2673);
    			attr_dev(blockquote2, "class", "title is-4");
    			add_location(blockquote2, file$2, 66, 28, 3190);
    			attr_dev(h65, "class", "title is-6 mb-0");
    			add_location(h65, file$2, 70, 28, 3407);
    			attr_dev(h66, "class", "is-6 mt-0");
    			add_location(h66, file$2, 71, 28, 3480);
    			attr_dev(div11, "class", "column m-1 mr-0 svelte-fxoshz");
    			add_location(div11, file$2, 65, 24, 3132);
    			attr_dev(div12, "class", "columns");
    			add_location(div12, file$2, 55, 20, 2627);
    			attr_dev(div13, "class", "column svelte-fxoshz");
    			add_location(div13, file$2, 54, 16, 2586);
    			attr_dev(div14, "class", "column svelte-fxoshz");
    			add_location(div14, file$2, 77, 16, 3693);
    			attr_dev(div15, "class", "columns");
    			add_location(div15, file$2, 53, 12, 2548);
    			attr_dev(div16, "id", "div-about");
    			attr_dev(div16, "class", "svelte-fxoshz");
    			add_location(div16, file$2, 8, 8, 349);
    			attr_dev(div17, "class", "container");
    			attr_dev(div17, "id", "container-about");
    			add_location(div17, file$2, 1, 4, 41);
    			attr_dev(section, "class", "section");
    			attr_dev(section, "id", "About");
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
    			append_dev(div0, h60);
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
    			append_dev(div2, h61);
    			append_dev(div2, t8);
    			append_dev(div2, h62);
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
    			append_dev(div6, h63);
    			append_dev(div6, t15);
    			append_dev(div6, h64);
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
    			append_dev(div11, h65);
    			append_dev(div11, t22);
    			append_dev(div11, h66);
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
    			h5.textContent = "Toto jsou naši partneři, bez kterých by tento projekt nemohl\n                vzniknout";
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
    			t10 = text("\n                                        Myslím si, že projekt CyDrone vedený pod\n                                        panem Waagem je ukázkou toho, jak může fungovat\n                                        podpora středních škol mezi nadanými studenty.");
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
    			t18 = text("\n                                        Tento projekt mě nadchl už od počátku jeho\n                                        vzniku, doufám, že budeme nadále ve velice\n                                        úzké spolupráci se všemi členy CyDrone.");
    			attr_dev(h2, "class", "title is-2");
    			add_location(h2, file$1, 3, 12, 125);
    			attr_dev(h5, "class", "subtitle is-5 has-text-grey");
    			add_location(h5, file$1, 4, 12, 174);
    			attr_dev(div0, "class", "has-text-centered pb-6");
    			add_location(div0, file$1, 2, 8, 76);
    			if (!src_url_equal(img0.src, img0_src_value = "/assets/img/partners/ssps_logo.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo_ssps");
    			add_location(img0, file$1, 13, 24, 554);
    			attr_dev(a0, "href", "https://ssps.cz");
    			attr_dev(a0, "alt", "#");
    			add_location(a0, file$1, 12, 20, 495);
    			attr_dev(div1, "class", "column is-3 svelte-gj03ff");
    			add_location(div1, file$1, 11, 16, 449);
    			if (!src_url_equal(img1.src, img1_src_value = "/assets/img/people/sablik.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Image");
    			add_location(img1, file$1, 25, 36, 1105);
    			attr_dev(figure0, "class", "image is-64x64");
    			add_location(figure0, file$1, 23, 32, 955);
    			attr_dev(div2, "class", "media-left");
    			add_location(div2, file$1, 22, 28, 898);
    			add_location(strong0, file$1, 34, 40, 1544);
    			attr_dev(a1, "href", "https://twitter.com/RadkoSablik");
    			add_location(a1, file$1, 36, 44, 1666);
    			add_location(small0, file$1, 35, 40, 1614);
    			add_location(br0, file$1, 42, 40, 2001);
    			add_location(p0, file$1, 33, 36, 1500);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$1, 32, 32, 1442);
    			attr_dev(div4, "class", "media-content");
    			add_location(div4, file$1, 31, 28, 1382);
    			attr_dev(article0, "class", "media");
    			add_location(article0, file$1, 21, 24, 846);
    			attr_dev(div5, "class", "box");
    			add_location(div5, file$1, 20, 20, 804);
    			attr_dev(div6, "class", "column svelte-gj03ff");
    			add_location(div6, file$1, 19, 16, 763);
    			attr_dev(div7, "class", "columns");
    			add_location(div7, file$1, 10, 12, 411);
    			if (!src_url_equal(img2.src, img2_src_value = "/assets/img/partners/haxagon.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "logo_ssps");
    			add_location(img2, file$1, 56, 24, 2642);
    			attr_dev(a2, "href", "https://haxagon.cz/");
    			attr_dev(a2, "alt", "#");
    			add_location(a2, file$1, 55, 20, 2579);
    			attr_dev(div8, "class", "column is-3 svelte-gj03ff");
    			add_location(div8, file$1, 54, 16, 2533);
    			if (!src_url_equal(img3.src, img3_src_value = "/assets/img/people/nathan.jpg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Image");
    			add_location(img3, file$1, 68, 36, 3191);
    			attr_dev(figure1, "class", "image is-64x64");
    			add_location(figure1, file$1, 66, 32, 3041);
    			attr_dev(div9, "class", "media-left");
    			add_location(div9, file$1, 65, 28, 2984);
    			add_location(strong1, file$1, 77, 40, 3630);
    			attr_dev(a3, "href", "https://twitter.com/nathannemec");
    			add_location(a3, file$1, 79, 44, 3752);
    			add_location(small1, file$1, 78, 40, 3700);
    			add_location(br1, file$1, 85, 40, 4087);
    			add_location(p1, file$1, 76, 36, 3586);
    			attr_dev(div10, "class", "content");
    			add_location(div10, file$1, 75, 32, 3528);
    			attr_dev(div11, "class", "media-content");
    			add_location(div11, file$1, 74, 28, 3468);
    			attr_dev(article1, "class", "media");
    			add_location(article1, file$1, 64, 24, 2932);
    			attr_dev(div12, "class", "box");
    			add_location(div12, file$1, 63, 20, 2890);
    			attr_dev(div13, "class", "column svelte-gj03ff");
    			add_location(div13, file$1, 62, 16, 2849);
    			attr_dev(div14, "class", "columns");
    			add_location(div14, file$1, 53, 12, 2495);
    			attr_dev(div15, "clas", "pt-6");
    			attr_dev(div15, "id", "Partners-columns");
    			attr_dev(div15, "class", "svelte-gj03ff");
    			add_location(div15, file$1, 9, 8, 359);
    			attr_dev(div16, "class", "container");
    			add_location(div16, file$1, 1, 4, 44);
    			attr_dev(section, "class", "section");
    			attr_dev(section, "id", "Partners");
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
    			h5.textContent = "Naše řešení obsahuje všechny důležité technikálie k zotovení\n                bezkonkurenčního zařízení";
    			t3 = space();
    			div5 = element("div");
    			div1 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t4 = space();
    			div4 = element("div");
    			div2 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Naše řešení tkví v tom, že si veškeré komponenty vytváříme\n                    sami. To znamená, že pokud uvidíte nějaký hardware, se\n                    kterým máme osazený náš dron, tak je naprosto unikátní. To\n                    nám dává velikou volnost jak můžeme s vývojem našho dronu\n                    pokračovat.";
    			t6 = space();
    			div3 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "Dále si zakládáme na funkcích, které by měl dron schopen\n                    zvládat. Díky tomu jsme vytvořili zařízení, které je velmi\n                    multifunkční a je schopno vykonávat mnoho úkonů, které mu\n                    jsou zadány";
    			attr_dev(h2, "class", "title is-2");
    			add_location(h2, file, 3, 12, 129);
    			attr_dev(h5, "class", "subtitle is-5 has-text-grey");
    			add_location(h5, file, 4, 12, 181);
    			attr_dev(div0, "class", "has-text-centered pb-6");
    			add_location(div0, file, 2, 8, 80);
    			if (!src_url_equal(img.src, img_src_value = "./assets/img/gallery/Dronik2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Drone");
    			add_location(img, file, 12, 20, 496);
    			attr_dev(figure, "class", "image");
    			add_location(figure, file, 11, 16, 453);
    			attr_dev(div1, "class", "column svelte-ya5y9t");
    			add_location(div1, file, 10, 12, 416);
    			add_location(strong0, file, 17, 20, 731);
    			attr_dev(div2, "class", "subtitle is-6 has-text-black");
    			add_location(div2, file, 16, 16, 668);
    			add_location(strong1, file, 24, 20, 1174);
    			attr_dev(div3, "class", "subtitle is-6 has-text-black");
    			add_location(div3, file, 23, 16, 1111);
    			attr_dev(div4, "class", "column svelte-ya5y9t");
    			attr_dev(div4, "id", "Solution_text");
    			add_location(div4, file, 15, 12, 612);
    			attr_dev(div5, "class", "columns");
    			add_location(div5, file, 9, 8, 382);
    			attr_dev(div6, "class", "container");
    			add_location(div6, file, 1, 4, 48);
    			attr_dev(section, "class", "section");
    			attr_dev(section, "id", "Our_solution");
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
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
