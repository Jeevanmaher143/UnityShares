public class Array {
    public static void main(String[] args) {
        int arr[] = { 2, 4, 2, 5, 7, 8, 9 };
        int first = Integer.MIN_VALUE;
        int second = Integer.MIN_VALUE;

        for (int num : arr) {
            if (num > first) {
                second = first;
                first = num;
            } else if (num > second && num != first) {
                second = num;
            }
        }
        if (second == Integer.MIN_VALUE) {
            System.out.println("No second largest element");
        } else {
            System.out.println("Second largest element is " + second);
        }
    }
}
