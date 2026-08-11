// User request: Create a new Framer code component file named LocalSlideshow.tsx exporting a component named LocalSlideshow as a local replacement for the external Slideshow in 3DInfinityCarousel, with centered active child, inactive scale/opacity, configurable tapInactiveToCenter behavior, arrows, optional drag/autoplay, directional layout, shared snap animation path, editable controls, preserved child content, accessibility, and no file/canvas edits beyond this new component.
import * as React from "react"
import {
    addPropertyControls,
    ControlType,
    useIsStaticRenderer,
} from "framer"
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion"

interface MyComponentProps {
    card1?: React.ReactNode
    card2?: React.ReactNode
    card3?: React.ReactNode
    card4?: React.ReactNode
    card5?: React.ReactNode
    card6?: React.ReactNode
    direction: "left" | "right" | "top" | "bottom"
    autoPlay: boolean
    interval: number
    draggable: boolean
    current: number
    align: "start" | "center" | "end"
    items: number
    gap: number
    padding: string
    radius: string
    activeScale: number
    inactiveScale: number
    activeOpacity: number
    inactiveOpacity: number
    tapInactiveToCenter: boolean
    showArrows: boolean
    arrowSize: number
    arrowBottom: number
    arrowGap: number
    arrowBackground: string
    arrowColor: string
    itemWidth: number
    itemHeight: number
    transitionType: "spring" | "tween"
    springStiffness: number
    springDamping: number
    tweenDuration: number
    background: string
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LocalSlideshow(props: MyComponentProps) {
    const {
        card1,
        card2,
        card3,
        card4,
        card5,
        card6,
        direction,
        autoPlay,
        interval,
        draggable,
        current,
        align,
        items,
        gap,
        padding,
        radius,
        activeScale,
        inactiveScale,
        activeOpacity,
        inactiveOpacity,
        tapInactiveToCenter,
        showArrows,
        arrowSize,
        arrowBottom,
        arrowGap,
        itemWidth,
        itemHeight,
        transitionType,
        springStiffness,
        springDamping,
        tweenDuration,
        background,
    } = props

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const shouldAnimate = !isStatic && !prefersReducedMotion

    const slottedChildren = React.useMemo(
        () =>
            [card1, card2, card3, card4, card5, card6].filter(
                (card): card is React.ReactNode => card !== null && card !== undefined
            ),
        [card1, card2, card3, card4, card5, card6]
    )
    const renderedItems = slottedChildren.length > 0 ? slottedChildren.length : items
    const totalItems = Math.max(renderedItems, 1)
    const isHorizontal = direction === "left" || direction === "right"
    const sequenceSign = direction === "right" || direction === "bottom" ? -1 : 1
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const clampIndex = React.useCallback(
        (index: number) => index,
        []
    )

    const [activeIndex, setActiveIndex] = React.useState(() => clampIndex(current))
    const previousCurrentRef = React.useRef<number>(current)
    const prevActiveIndexRef = React.useRef(activeIndex)

    React.useEffect(() => {
        prevActiveIndexRef.current = activeIndex
    }, [activeIndex])

    React.useEffect(() => {
        if (previousCurrentRef.current === current) return
        previousCurrentRef.current = current
        const next = clampIndex(current)
        if (next !== activeIndex) {
            React.startTransition(() => setActiveIndex(next))
        }
    }, [activeIndex, clampIndex, current])

    const snapToIndex = React.useCallback(
        (target: number) => {
            if (totalItems <= 1) return;
            const normalizedActive = ((activeIndex % totalItems) + totalItems) % totalItems;
            const normalizedTarget = ((target % totalItems) + totalItems) % totalItems;
            let diff = normalizedTarget - normalizedActive;
            const half = totalItems / 2;
            let wrappedDiff = ((diff + half) % totalItems);
            if (wrappedDiff < 0) wrappedDiff += totalItems;
            wrappedDiff -= half;

            const targetIndex = activeIndex + wrappedDiff;
            React.startTransition(() => setActiveIndex(targetIndex));
        },
        [activeIndex, totalItems]
    )

    const resetTrackOffset = React.useCallback(() => {
        if (!shouldAnimate) {
            x.set(0)
            y.set(0)
            return
        }
        const transition =
            transitionType === "spring"
                ? { type: "spring" as const, stiffness: springStiffness, damping: springDamping }
                : { type: "tween" as const, duration: tweenDuration }
        const xAnimation = animate(x, 0, transition)
        const yAnimation = animate(y, 0, transition)
        return () => {
            xAnimation.stop()
            yAnimation.stop()
        }
    }, [
        shouldAnimate,
        springDamping,
        springStiffness,
        transitionType,
        tweenDuration,
        x,
        y,
    ])

    React.useEffect(() => {
        return resetTrackOffset()
    }, [
        activeIndex,
        resetTrackOffset,
    ])

    React.useEffect(() => {
        if (!autoPlay || isStatic || totalItems <= 1) return
        if (typeof window === "undefined") return
        const id = window.setInterval(() => {
            React.startTransition(() => {
                setActiveIndex((prev) => (prev >= totalItems - 1 ? 0 : prev + 1))
            })
        }, Math.max(400, interval))
        return () => window.clearInterval(id)
    }, [autoPlay, interval, isStatic, totalItems])

    const getDragDelta = React.useCallback(
        (offsetX: number, offsetY: number) => {
            const threshold = 50
            if (isHorizontal) {
                if (offsetX < -threshold) return direction === "left" ? 1 : -1
                if (offsetX > threshold) return direction === "left" ? -1 : 1
                return 0
            }
            if (offsetY < -threshold) return direction === "top" ? 1 : -1
            if (offsetY > threshold) return direction === "top" ? -1 : 1
            return 0
        },
        [direction, isHorizontal]
    )

    const onDragEnd = React.useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
            const delta = getDragDelta(info?.offset?.x ?? 0, info?.offset?.y ?? 0)
            if (delta === 0) {
                snapToIndex(activeIndex)
                resetTrackOffset()
                return
            }
            snapToIndex(activeIndex + delta)
            resetTrackOffset()
        },
        [activeIndex, getDragDelta, resetTrackOffset, snapToIndex]
    )

    const step = Math.max(1, itemWidth * 0.76 + gap)
    const dragDistance = step
    const crossAlign =
        align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center"

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                padding,
                borderRadius: radius,
                background,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                    x,
                    y,
                    touchAction: isHorizontal ? "pan-y" : "pan-x",
                    display: "flex",
                    alignItems: crossAlign,
                    justifyContent: "center",
                }}
                drag={draggable ? (isHorizontal ? "x" : "y") : false}
                dragConstraints={
                    isHorizontal
                        ? { left: -dragDistance, right: dragDistance, top: 0, bottom: 0 }
                        : { left: 0, right: 0, top: -dragDistance, bottom: dragDistance }
                }
                dragElastic={0.15}
                dragMomentum={false}
                onDragEnd={draggable ? onDragEnd : undefined}
            >
                {slottedChildren.map((child, index) => {
                    const normalizedActiveIndex = ((activeIndex % totalItems) + totalItems) % totalItems;
                    const isActive = index === normalizedActiveIndex;
                    const canTapToCenter = tapInactiveToCenter && !isActive;

                    let diff = index - activeIndex;
                    const half = totalItems / 2;
                    let wrappedDiff = ((diff + half) % totalItems);
                    if (wrappedDiff < 0) wrappedDiff += totalItems;
                    wrappedDiff -= half;

                    // Track previous active index to check for teleportation
                    const prevActiveIndex = prevActiveIndexRef.current;
                    let prevDiff = index - prevActiveIndex;
                    let prevWrappedDiff = ((prevDiff + half) % totalItems);
                    if (prevWrappedDiff < 0) prevWrappedDiff += totalItems;
                    prevWrappedDiff -= half;

                    const isTeleporting = Math.abs(wrappedDiff - prevWrappedDiff) > 1.5;

                    const relativeOffset = wrappedDiff * step * sequenceSign;
                    const childX = isHorizontal
                        ? -itemWidth / 2 + relativeOffset
                        : -itemWidth / 2;
                    const childY = isHorizontal
                        ? -itemHeight / 2
                        : -itemHeight / 2 + relativeOffset;

                    const transition: any = isTeleporting
                        ? { type: "tween", duration: 0 }
                        : (shouldAnimate
                            ? (transitionType === "spring"
                                ? { type: "spring", stiffness: springStiffness, damping: springDamping }
                                : { type: "tween", duration: tweenDuration })
                            : { type: "tween", duration: 0 });

                    const isAboveTablet = typeof window !== 'undefined' && window.innerWidth >= 768;
                    const isVisibleCard = !isAboveTablet || Math.abs(wrappedDiff) <= 1;
                    const opacityValue = isActive 
                        ? activeOpacity 
                        : (isVisibleCard ? inactiveOpacity : 0);
                    const pointerEventsValue = (isActive || (tapInactiveToCenter && isVisibleCard)) ? "auto" : "none";

                    return (
                        <motion.div
                            key={index}
                            initial={false}
                            onTap={canTapToCenter ? () => snapToIndex(index) : undefined}
                            onClick={canTapToCenter ? () => snapToIndex(index) : undefined}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: `${itemWidth}px`,
                                height: `${itemHeight}px`,
                                transformOrigin: "center center",
                                cursor: canTapToCenter ? "pointer" : "default",
                                pointerEvents: pointerEventsValue,
                                zIndex: totalItems - Math.abs(wrappedDiff),
                            }}
                            animate={{
                                x: childX,
                                y: childY,
                                scale: isActive ? activeScale : inactiveScale,
                                opacity: opacityValue,
                            }}
                            transition={transition}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    pointerEvents: "auto",
                                }}
                            >
                                {React.isValidElement(child)
                                    ? React.cloneElement(child, { isActive } as any)
                                    : child}
                            </div>
                        </motion.div>
                    )
                })}
            </motion.div>

            {showArrows && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: `${arrowBottom}px`,
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: `${arrowGap}px`,
                        zIndex: 10,
                    }}
                >
                    <button
                        aria-label="Previous slide"
                        onClick={() => snapToIndex(activeIndex - 1)}
                        style={{
                            width: `${arrowSize}px`,
                            height: `${arrowSize}px`,
                            borderRadius: "999px",
                            border: "none",
                            background: "#e8e8e8",
                            color: "#494d4d",
                            cursor: "pointer",
                            opacity: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button
                        aria-label="Next slide"
                        onClick={() => snapToIndex(activeIndex + 1)}
                        style={{
                            width: `${arrowSize}px`,
                            height: `${arrowSize}px`,
                            borderRadius: "999px",
                            border: "none",
                            background: "#e8e8e8",
                            color: "#494d4d",
                            cursor: "pointer",
                            opacity: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )
}

addPropertyControls(LocalSlideshow, {
    card1: {
        type: ControlType.ComponentInstance,
        title: "Card 1",
    },
    card2: {
        type: ControlType.ComponentInstance,
        title: "Card 2",
    },
    card3: {
        type: ControlType.ComponentInstance,
        title: "Card 3",
    },
    card4: {
        type: ControlType.ComponentInstance,
        title: "Card 4",
    },
    card5: {
        type: ControlType.ComponentInstance,
        title: "Card 5",
    },
    card6: {
        type: ControlType.ComponentInstance,
        title: "Card 6",
    },
    tapInactiveToCenter: {
        type: ControlType.Boolean,
        title: "Tap inactive to center",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        defaultValue: "left",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3000,
        min: 400,
        max: 12000,
        step: 100,
        unit: "ms",
        hidden: (props: any) => !props.autoPlay,
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Draggable",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    current: {
        type: ControlType.Number,
        title: "Current",
        defaultValue: 1,
        min: 0,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        defaultValue: "center",
    },
    items: {
        type: ControlType.Number,
        title: "Items",
        defaultValue: 6,
        min: 1,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 0,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px 0px 80px 0px",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 320,
        min: 120,
        max: 1200,
        step: 1,
        unit: "px",
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 455,
        min: 120,
        max: 1200,
        step: 1,
        unit: "px",
    },
    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        defaultValue: 1,
        min: 0.4,
        max: 1.4,
        step: 0.01,
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        defaultValue: 0.62,
        min: 0.3,
        max: 1,
        step: 0.01,
    },
    activeOpacity: {
        type: ControlType.Number,
        title: "Active Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 40,
        min: 24,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (props: any) => !props.showArrows,
    },
    arrowBottom: {
        type: ControlType.Number,
        title: "Arrow Bottom",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (props: any) => !props.showArrows,
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Arrow Gap",
        defaultValue: 12,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (props: any) => !props.showArrows,
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow BG",
        defaultValue: "#EEEEEE",
        hidden: (props: any) => !props.showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000000",
        hidden: (props: any) => !props.showArrows,
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["spring", "tween"],
        optionTitles: ["Spring", "Tween"],
        defaultValue: "spring",
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 300,
        min: 50,
        max: 1000,
        step: 10,
        hidden: (props: any) => props.transitionType !== "spring",
    },
    springDamping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 30,
        min: 5,
        max: 100,
        step: 1,
        hidden: (props: any) => props.transitionType !== "spring",
    },
    tweenDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.35,
        min: 0.05,
        max: 2,
        step: 0.01,
        unit: "s",
        hidden: (props: any) => props.transitionType !== "tween",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
})
